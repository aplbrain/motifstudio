"""Module for handling local graph files (either uncompressed or compressed with gzip)."""

import networkx as nx
from .host_provider import NetworkXHostProvider

ACCEPTED_EXTENSIONS = {
    "graphml": nx.read_graphml,
    "graphml.gz": nx.read_graphml,
    "gml": nx.read_gml,
    "gexf": nx.read_gexf,
    "gexf.gz": nx.read_gexf,
}


class SingleFileGraphHostProvider(NetworkXHostProvider):
    """Handle local single-file graphs (either uncompressed or compressed with gzip)."""

    def accepts(self, uri: str) -> bool:
        """Return True if the URI is a local filesystem URI.

        Arguments:
            uri (str): The URI to check.

        Returns:
            bool: True if the URI is a local filesystem URI graph file that
                ends with an accepted extension.

        """
        return any(uri.endswith(ext) for ext in ACCEPTED_EXTENSIONS.keys())

    def get_networkx_graph(self, uri: str) -> nx.Graph:
        """Return a NetworkX graph for the URI.

        Arguments:
            uri (str): The URI of the host.

        Returns:
            nx.Graph: The NetworkX graph.

        """
        return ACCEPTED_EXTENSIONS[uri.split(".")[-1]](uri)
