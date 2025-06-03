"""FastAPI commons management.

This file handles the configuration of the server and the global management of
that information during runtime.

That includes managing the user-defined hosts, host providers, and query cache.

"""

import json
from functools import lru_cache
from pathlib import Path

import resource
import multiprocessing as mp
import platform
import subprocess


from ..host_provider.router import HostProvider, HostProviderRouter, provider_name_map
from ..models import HostListing, HostProviderID


def _providers_from_json_config(providers: list[dict]) -> dict[HostProviderID, HostProvider]:
    """Returns a configured list from a dictionary of host provider configs.

    Most likely from a JSON file.

    Arguments:
        providers (list[dict]): The dictionary of host provider configs. Should include
            "type" and "arguments" keys.

    Returns:
        list[HostProvider]: The list of configured host providers.

    """
    return {provider["id"]: provider_name_map[provider["type"]](**provider["arguments"]) for provider in providers}


def _hosts_from_json_config(hosts: list[dict]) -> list[HostListing]:
    """Returns a configured list from a dictionary of host configs.

    Most likely from a JSON file.

    Arguments:
        hosts (list[dict]): The dictionary of host configs. Should include "uri"
            and "name" keys.

    Returns:
        list[HostListing]: The list of configured hosts.

    """
    return [HostListing(**host) for host in hosts]


def get_total_ram_bytes() -> int:
    """Return total system RAM in bytes."""
    system = platform.system()
    if system == "Linux":
        with open("/proc/meminfo", "r") as f:
            for line in f:
                if line.startswith("MemTotal:"):
                    parts = line.split()
                    return int(parts[1]) * 1024
    elif system == "Darwin":
        try:
            out = subprocess.check_output(["sysctl", "-n", "hw.memsize"])
            return int(out)
        except Exception:
            pass
    try:
        import psutil

        return psutil.virtual_memory().total
    except ImportError:
        raise RuntimeError("Cannot determine total system memory; install psutil or implement OS support")


def _run_with_limits_target(queue, func, args, kwargs, max_ram_bytes, timeout_seconds):
    """Helper target for run_with_limits: apply resource limits and execute func."""
    try:
        if max_ram_bytes is not None:
            try:
                _, hard = resource.getrlimit(resource.RLIMIT_AS)
                resource.setrlimit(
                    resource.RLIMIT_AS,
                    (min(max_ram_bytes, hard), hard),
                )
            except (ValueError, OSError):
                pass
        if timeout_seconds is not None:
            try:
                _, hard = resource.getrlimit(resource.RLIMIT_CPU)
                resource.setrlimit(
                    resource.RLIMIT_CPU,
                    (min(int(timeout_seconds), hard), hard),
                )
            except (ValueError, OSError):
                pass
        result = func(*args, **kwargs)
        queue.put((True, result))
    except Exception as e:
        queue.put((False, e))


def run_with_limits(func, args=(), kwargs=None, max_ram_bytes=None, timeout_seconds=None):
    """Run func in a subprocess with memory and time limits."""
    kwargs = kwargs or {}
    queue = mp.Queue()

    proc = mp.Process(
        target=_run_with_limits_target,
        args=(queue, func, args, kwargs, max_ram_bytes, timeout_seconds),
    )
    proc.start()
    proc.join(timeout_seconds)
    if proc.is_alive():
        proc.terminate()
        proc.join(timeout_seconds)
        # Ensure the process is killed if it did not exit
        if proc.is_alive() and hasattr(proc, "kill"):
            proc.kill()
            proc.join(0)
        raise TimeoutError(f"Query exceeded time limit of {timeout_seconds} seconds")
    if queue.empty():
        raise MemoryError(f"Query exceeded memory limit of {max_ram_bytes} bytes or terminated unexpectedly")
    success, payload = queue.get()
    if success:
        return payload
    raise payload


class HostProviderRouterGlobalDep:
    """The global dependency that manages host provider routes.

    This class is responsible for loading and storing the host provider list,
    the host list, the routing from host requests to host providers, and the
    query cache.

    """

    def __init__(self, json_filepath_or_dict: str | dict | Path):
        """Initialize the global dependency, loading a config.

        Arguments:
            json_filepath_or_dict (str | dict | Path): The path to the JSON
                config file or the dictionary of the config.

        Returns:
            None

        """
        if isinstance(json_filepath_or_dict, str):
            with open(json_filepath_or_dict, "r") as f:
                config = json.load(f)
        elif isinstance(json_filepath_or_dict, Path):
            config = json.loads(json_filepath_or_dict.read_text())
        else:
            config = json_filepath_or_dict
        self.host_provider_router = HostProviderRouter(_providers_from_json_config(config["providers"]))
        self.all_hosts = _hosts_from_json_config(config["hosts"])
        self.temporary_hosts = []  # Private list for uploaded temporary files
        self.host_provider_router.validate_all_hosts(self.all_hosts)

        # Query resource limits: memory (fraction or absolute) and wall-clock timeout
        ql = config.get("query_limits", {})
        self.max_ram_pct = ql.get("max_ram_pct", 0.5)
        self.max_ram_bytes = ql.get("max_ram_bytes")
        self.max_duration_seconds = ql.get("max_duration_seconds", 120)

    def get_uri_from_id(self, id: str) -> str | None:
        """Returns the URI of a host from its name.

        Arguments:
            id (str): The ID of the host.

        Returns:
            str | None: The URI of the host, or None if it doesn't exist.

        """
        # Check public hosts first
        for host in self.all_hosts:
            if host.id == id:
                return host.uri

        # Check temporary hosts (unlisted)
        for host in self.temporary_hosts:
            if host.id == id:
                return host.uri

        return None

    def get_host_listing_from_id(self, id: str) -> HostListing | None:
        """Returns the HostListing of a host from its ID.

        Arguments:
            id (str): The ID of the host.

        Returns:
            HostListing | None: The HostListing of the host, or None if it doesn't exist.

        """
        # Check public hosts first
        for host in self.all_hosts:
            if host.id == id:
                return host

        # Check temporary hosts (unlisted)
        for host in self.temporary_hosts:
            if host.id == id:
                return host

        return None

    def get_name_from_uri(self, uri: str) -> str | None:
        """Returns the name of a host from its URI.

        Arguments:
            uri (str): The URI of the host.

        Returns:
            str | None: The name of the host, or None if it doesn't exist.

        """
        # Check public hosts first
        for host in self.all_hosts:
            if host.uri == uri:
                return host.name

        # Check temporary hosts (unlisted)
        for host in self.temporary_hosts:
            if host.uri == uri:
                return host.name

        return None

    def all_providers(self) -> dict[HostProviderID, HostProvider]:
        """Returns the list of all configured host providers.

        Arguments:
            None

        Returns:
            list[HostProvider]: The list of all configured host providers.

        """
        return self.host_provider_router.all_providers()

    def add_temporary_host(self, host: HostListing) -> None:
        """Add a temporary (unlisted) host.

        These hosts are not visible in the public host list but can be
        accessed directly if you know their ID.

        Arguments:
            host (HostListing): The host to add.

        Returns:
            None
        """
        self.temporary_hosts.append(host)

    def remove_temporary_host(self, host_id: str) -> bool:
        """Remove a temporary host by ID.

        Arguments:
            host_id (str): The ID of the host to remove.

        Returns:
            bool: True if the host was found and removed, False otherwise.
        """
        for i, host in enumerate(self.temporary_hosts):
            if host.id == host_id:
                del self.temporary_hosts[i]
                return True
        return False


@lru_cache()
def provider_router():
    """Returns the global dependency that manages host provider routes.

    This function is cached, so it will only be called once during runtime.
    (This saves the cost of the disk round-trip.)

    Arguments:
        None

    Returns:
        HostProviderRouterGlobalDep: The global dependency that manages host
            provider routes.

    """
    _here = Path(__file__).parent
    return HostProviderRouterGlobalDep(_here / "config.json")


__all__ = [
    "provider_router",
    "HostProviderRouterGlobalDep",
    "get_total_ram_bytes",
    "run_with_limits",
]
