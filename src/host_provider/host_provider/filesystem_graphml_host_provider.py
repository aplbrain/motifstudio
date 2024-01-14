"""A Host Provider that can handle local GraphML files."""

from pathlib import Path
from .GraphMLHostProvider import SingleFileGraphHostProvider
import networkx as nx


class FilesystemGraphHostProvider(SingleFileGraphHostProvider):
    """A Host Provider that can handle local filesystem URIs."""

    def __init__(self, root: str = ""):
        """Initialize the provider.

        Arguments:
            root (str): The root directory of the filesystem. Defaults to "/".

        Returns:
            None

        """
        self.root = root

    @property
    def type(self) -> str:
        """Return the type of the provider."""
        return "FilesystemGraphHostProvider"

    def accepts(self, uri: str) -> bool:
        """Return True if the URI is a local filesystem URI."""
        return uri.startswith(f"file://{self.root}") and super().accepts(uri)

    def get_networkx_graph(self, uri: str) -> nx.Graph:
        """Return a NetworkX graph from a URI.

        Arguments:
            uri (str): The URI of the graph.

        Returns:
            nx.Graph: The NetworkX graph.

        """
        # Save the graph to a temporary file, then read it back in.
        # This is a workaround for NetworkX, which prevents reading from a
        # file-like object.
        filepath = uri[len("file://") :]
        # If the filepath starts with $, replace $ with the current top-level
        # directory of this project.
        if filepath.startswith("$"):
            # Jankiness! There's no way to get the top-level directory of the
            # project from the host_provider package, so we have to go up four
            # levels with pathlib.
            cwd = Path(__file__).parent.parent.parent.parent
            filepath = filepath.replace("$", str(cwd))
        return super().get_networkx_graph(filepath)
