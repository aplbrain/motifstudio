from .host_provider import GraphMLHostProvider
import networkx as nx


class FilesystemGraphMLHostProvider(GraphMLHostProvider):
    """
    A Host Provider that can handle local filesystem URIs.

    """

    def __init__(self, root: str = "/"):
        self.root = root

    @property
    def type(self) -> str:
        """
        Return the type of the provider.

        """
        return "FilesystemGraphMLHostProvider"

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
        return super().get_networkx_graph(uri[len("file://") :])
