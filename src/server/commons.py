from host_provider_router import FilesystemGraphMLHostProvider, HostProviderRouter


class HostProviderRouterGlobalDep:
    def __init__(self):
        self.host_provider_router = HostProviderRouter([FilesystemGraphMLHostProvider()])
        self.all_hosts = [
            "file:///Users/mateljk1/Library/CloudStorage/Box-Box/1-resources/data/graphs/Connectome-Data/motifs/cached-motif-counts/developmental-motifs/_data_cache/graphs/Witvliet_attributed_1.graphml"
        ]
