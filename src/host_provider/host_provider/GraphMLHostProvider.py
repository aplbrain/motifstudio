import networkx as nx
from .host_provider import NetworkXHostProvider


class GraphMLHostProvider(NetworkXHostProvider):
    """
    A Host Provider that can handle local filesystem URIs and load GraphML
    files (either uncompressed or compressed with gzip).

    """

    def accepts(self, uri: str) -> bool:
        """
        Return True if the URI is a local filesystem URI.

        Arguments:
            uri (str): The URI to check.

        Returns:
            bool: True if the URI is a local filesystem URI GraphML file that
                ends with .graphml, .graphml.gz, or .gml.

        """
        return uri.endswith(".graphml") or uri.endswith(".graphml.gz") or uri.endswith(".gml")

    def get_networkx_graph(self, uri: str) -> nx.Graph:
        """
        Return a NetworkX graph for the URI.

        Arguments:
            uri (str): The URI of the host.

        Returns:
            nx.Graph: The NetworkX graph.

        """
        return nx.read_graphml(uri)  # type: ignore
