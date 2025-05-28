"""The Host Provider router routes a query to the correct HostProvider."""
from .host_provider import (
    HostProvider,
    FilesystemGraphHostProvider,
    S3GraphMLHostProvider,
    OpenCypherHostProvider,
    TemporaryGraphHostProvider,
)

from ..models import HostListing, HostProviderID


class HostProviderRouter:
    """A router to route host queries to the correct provider.

    A Host Provider Router manages a set of HostProviders and routes queries to
    the appropriate provider based on the string URI of the host.

    Each provider has an "accepts" method that takes a URI and returns True if
    the provider can handle the host. Providers are added in order, and the
    first provider that accepts the host is used.

    """

    def __init__(self, providers: dict[HostProviderID, HostProvider] | None = None):
        """Initialize the router.

        Arguments:
            providers (list[HostProvider]): A list of HostProviders.

        Returns:
            None

        """
        self._providers: dict[HostProviderID, HostProvider] = providers or {}

    def add_provider(self, id: HostProviderID, provider: HostProvider):
        """Add a provider to the router."""
        self._providers[id] = provider

    def all_providers(self) -> dict[HostProviderID, HostProvider]:
        """Return a list of all providers."""
        return self._providers

    def provider_for(self, uri: str) -> HostProvider | None:
        """Return the first provider that accepts the URI.

        Arguments:
            uri: A string URI.

        Returns:
            The first provider that accepts the URI, or None if no provider
            accepts the URI.

        """
        for _id, provider in self._providers.items():
            if provider.accepts(uri):
                return provider
        return None

    def validate_all_hosts(self, host_uris: list[str] | list[HostListing]) -> list[bool]:
        """Return a list of booleans indicating whether each host is valid.

        Arguments:
            host_uris: A list of host URIs.

        Returns:
            A list of booleans indicating whether each host is valid.

        """
        return [self.provider_for((host if isinstance(host, str) else host.uri)) is not None for host in host_uris]


provider_name_map = {
    "FilesystemGraphHostProvider": FilesystemGraphHostProvider,
    "S3GraphMLHostProvider": S3GraphMLHostProvider,
    "OpenCypherHostProvider": OpenCypherHostProvider,
    "TemporaryGraphHostProvider": TemporaryGraphHostProvider,
}

__all__ = [
    "HostProviderRouter",
    "provider_name_map",
]
