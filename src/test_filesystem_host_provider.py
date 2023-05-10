import tempfile
import networkx as nx
from .host_provider_router import FilesystemGraphMLHostProvider


def test_can_create_provider_from_path():
    # Create a temporary file graphml.
    g = nx.fast_gnp_random_graph(10, 0.1)  # type: ignore
    with tempfile.NamedTemporaryFile(suffix=".graphml") as f:
        nx.write_graphml(g, f.name)  # type: ignore
        # Create a provider from the path.
        uri = "file://" + f.name
        r = FilesystemGraphMLHostProvider()
        # Check that the provider accepts the path.
        assert r.accepts(uri) is True
        # Check that the provider can get the graph.
        assert nx.is_isomorphic(g, r.get_networkx_graph(uri)) is True
