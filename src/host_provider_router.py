from typing import Protocol
import tempfile
from models import HostListing
import networkx as nx
import boto3


class HostProvider(Protocol):
    """
    A Host Provider is a class that can execute a motif query on a host network
    and return the results.

    """

    def accepts(self, uri: str) -> bool:
        """
        Return True if this provider can handle the URI.

        Accept calls should run quickly and do minimal work so that the router
        can quickly find the correct provider.

        """
        raise NotImplementedError()

    def get_vertex_count(self, uri: str) -> int:
        """
        Return the number of vertices in the graph.

        """
        raise NotImplementedError()

    def get_edge_count(self, uri: str) -> int:
        """
        Return the number of edges in the graph.

        """
        raise NotImplementedError()


class GraphMLHostProvider(HostProvider):
    """
    A Host Provider that can handle local filesystem URIs.

    """

    def accepts(self, uri: str) -> bool:
        """
        Return True if the URI is a local filesystem URI.

        """
        return uri.endswith(".graphml") or uri.endswith(".graphml.gz") or uri.endswith(".gml")

    def get_networkx_graph(self, uri: str) -> nx.Graph:
        """
        Return a NetworkX graph for the URI.

        """
        return nx.read_graphml(uri)  # type: ignore

    def get_vertex_count(self, uri: str) -> int:
        """
        Return the number of vertices in the graph.

        """
        return len(self.get_networkx_graph(uri).nodes)

    def get_edge_count(self, uri: str) -> int:
        """
        Return the number of edges in the graph.

        """
        return len(self.get_networkx_graph(uri).edges)


class S3GraphMLHostProvider(GraphMLHostProvider):
    """
    A Host Provider that can handle S3 URIs.

    """

    def __init__(self, bucket: str, s3_client=None):
        self.bucket = bucket
        self.s3_client = s3_client or boto3.client("s3")

    def accepts(self, uri: str) -> bool:
        """
        Return True if the URI is an S3 URI.

        """
        return uri.startswith(f"s3://{self.bucket}/") and super().accepts(uri)

    def get_networkx_graph(self, uri: str) -> nx.Graph:
        # Save the graph to a temporary file, then read it back in.
        # This is a workaround for NetworkX, which prevents reading from a
        # file-like object.
        with tempfile.NamedTemporaryFile() as f:
            self.s3_client.download_file(self.bucket, uri[len(f"s3://{self.bucket}/") :], f.name)
            return super().get_networkx_graph(f.name)


class FilesystemGraphMLHostProvider(GraphMLHostProvider):
    """
    A Host Provider that can handle local filesystem URIs.

    """

    def __init__(self, root: str = "/"):
        self.root = root

    def accepts(self, uri: str) -> bool:
        """
        Return True if the URI is a local filesystem URI.

        """
        print(uri, f"file://{self.root}")
        return uri.startswith(f"file://{self.root}") and super().accepts(uri)

    def get_networkx_graph(self, uri: str) -> nx.Graph:
        # Save the graph to a temporary file, then read it back in.
        # This is a workaround for NetworkX, which prevents reading from a
        # file-like object.
        return super().get_networkx_graph(uri[len(f"file://") :])


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

    def provider_for(self, uri: str) -> HostProvider | None:
        """
        Return the first provider that accepts the URI.

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
        return [
            self.provider_for(host.uri if isinstance(host, HostListing) else host) is not None for host in host_uris
        ]


provider_name_map = {
    "s3graphml": S3GraphMLHostProvider,
    "fsgraphml": FilesystemGraphMLHostProvider,
}

__all__ = [
    "HostProvider",
    "S3GraphMLHostProvider",
    "FilesystemGraphMLHostProvider",
    "HostProviderRouter",
    "provider_name_map",
]
