from host_provider_router import FilesystemGraphMLHostProvider, HostProviderRouter
from ..models import HostListing


class HostProviderRouterGlobalDep:
    """
    The global dependency that manages host provvider routes.
    """

    def __init__(self):
        self.host_provider_router = HostProviderRouter([FilesystemGraphMLHostProvider()])
        self.all_hosts: list[HostListing] = [
            HostListing(
                uri="file:///Users/mateljk1/Library/CloudStorage/Box-Box/1-resources/data/graphs/Connectome-Data/motifs/cached-motif-counts/developmental-motifs/_data_cache/graphs/Witvliet_attributed_1.graphml",
                name="Witvliet 1",
            ),
            HostListing(
                uri="file:///Users/mateljk1/Library/CloudStorage/Box-Box/1-resources/data/graphs/Connectome-Data/motifs/cached-motif-counts/developmental-motifs/_data_cache/graphs/Witvliet_attributed_2.graphml",
                name="Witvliet 2",
            ),
        ]
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
