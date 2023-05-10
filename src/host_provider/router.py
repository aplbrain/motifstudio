"""
The Host Provider Router is a class that can route a query to the correct
HostProvider.
"""
from .host_provider import HostProvider, FilesystemGraphMLHostProvider, S3GraphMLHostProvider

from ..models import HostListing


class HostProviderRouter:
    """
    A Host Provider Router manages a set of HostProviders and routes queries to
    the appropriate provider based on the string URI of the host.

    Each provider has an "accepts" method that takes a URI and returns True if
    the provider can handle the host. Providers are added in order, and the
    first provider that accepts the host is used.

    """

    def __init__(self, providers: list[HostProvider] | None = None):
        self._providers: list[HostProvider] = providers or []

    def add_provider(self, provider: HostProvider):
        """
        Add a provider to the router.

        """
        self._providers.append(provider)

    def all_providers(self) -> list[HostProvider]:
        """
        Return a list of all providers.

        """
        return self._providers

    def provider_for(self, uri: str) -> HostProvider | None:
        """
        Return the first provider that accepts the URI.

        Arguments:
            uri: A string URI.

        Returns:
            The first provider that accepts the URI, or None if no provider
            accepts the URI.

        """
        for provider in self._providers:
            if provider.accepts(uri):
                return provider
        return None

    def validate_all_hosts(self, host_uris: list[str] | list[HostListing]) -> list[bool]:
        """
        Return a list of booleans indicating whether each host is valid.

        Arguments:
            hosts: A list of host URIs.

        Returns:
            A list of booleans indicating whether each host is valid.

        """
        return [self.provider_for((host if isinstance(host, str) else host.uri)) is not None for host in host_uris]


provider_name_map = {
    "FilesystemGraphMLHostProvider": FilesystemGraphMLHostProvider,
    "S3GraphMLHostProvider": S3GraphMLHostProvider,
}

__all__ = [
    "HostProviderRouter",
    "provider_name_map",
]
