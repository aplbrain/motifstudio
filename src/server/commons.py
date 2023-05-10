import json
from functools import lru_cache
from pathlib import Path

from host_provider_router import (
    FilesystemGraphMLHostProvider,
    HostProvider,
    HostProviderRouter,
    provider_name_map,
)

from ..models import HostListing


def _providers_from_json_config(providers: list[dict]) -> list[HostProvider]:
    """
    Returns a configured list from a dictionary of host provider configs.

    Most likely from a JSON file.

    Arguments:
        data (dict): The dictionary of host provider configs. Should include
            "type" and "arguments" keys.

    Returns:
        list[HostProvider]: The list of configured host providers.

    """
    return [provider_name_map[provider["type"]](**provider["arguments"]) for provider in providers]


def _hosts_from_json_config(hosts: list[dict]) -> list[HostListing]:
    """
    Returns a configured list from a dictionary of host configs.

    Most likely from a JSON file.

    Arguments:
        data (dict): The dictionary of host configs. Should include "uri" and
        "name" keys.

    Returns:
        list[HostListing]: The list of configured hosts.

    """
    return [HostListing(**host) for host in hosts]


class HostProviderRouterGlobalDep:
    """
    The global dependency that manages host provider routes.
    """

    def __init__(self, json_filepath_or_dict: str | dict | Path):
        if isinstance(json_filepath_or_dict, str):
            with open(json_filepath_or_dict, "r") as f:
                config = json.load(f)
        elif isinstance(json_filepath_or_dict, Path):
            config = json.loads(json_filepath_or_dict.read_text())
        else:
            config = json_filepath_or_dict
        self.host_provider_router = HostProviderRouter(_providers_from_json_config(config["providers"]))
        self.all_hosts = _hosts_from_json_config(config["hosts"])
        self.host_provider_router.validate_all_hosts(self.all_hosts)

    def get_uri_from_name(self, name: str) -> str | None:
        for host in self.all_hosts:
            if host.name == name:
                return host.uri
        return None

    def get_name_from_uri(self, uri: str) -> str | None:
        for host in self.all_hosts:
            if host.uri == uri:
                return host.name
        return None

    def all_providers(self) -> list[HostProvider]:
        return self.host_provider_router.all_providers()


@lru_cache()
def provider_router():
    _here = Path(__file__).parent
    return HostProviderRouterGlobalDep(_here / "config.json")


__all__ = ["provider_router", "HostProviderRouterGlobalDep"]
