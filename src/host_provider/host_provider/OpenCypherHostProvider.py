import pathlib
import networkx as nx
from grand_cypher_io import opencypher_buffers_to_graph

from .host_provider import NetworkXHostProvider


class OpenCypherHostProvider(NetworkXHostProvider):
    """
    A HostProvider that reads files in the OpenCypher CSV format.

    """

    def accepts(self, uri: str) -> bool:
        """
        Returns True if the URI is a local filesystem directory.

        """

        return uri.startswith("opencypher://")

    def get_networkx_graph(self, uri: str) -> nx.Graph:
        """
        Return a NetworkX graph for the URI.

        Arguments:
            uri (str): The URI of the host.

        Returns:
            nx.Graph: The NetworkX graph.

        """
        # TODO: Support non-file://-schemes
        _uri = uri.split("://")[-1]
        # Guess the vertex and edge CSV files:
        # TODO: Argumentize this...
        _vertex_csv = list(pathlib.Path(_uri).glob("vert*"))
        _edge_csv = list(pathlib.Path(_uri).glob("edge*"))
        return opencypher_buffers_to_graph(_vertex_csv, _edge_csv)
