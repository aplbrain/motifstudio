import tempfile
import networkx as nx
from .host_provider_router import FilesystemGraphMLHostProvider


def test_can_create_runner_from_path():
    # Create a temporary file graphml.
    g = nx.fast_gnp_random_graph(10, 0.1)
    with tempfile.NamedTemporaryFile(suffix=".graphml") as f:
        nx.write_graphml(g, f.name)
        # Create a runner from the path.
        uri = "file://" + f.name
        r = FilesystemGraphMLHostProvider()
        # Check that the runner accepts the path.
        assert r.accepts(uri) is True
        # Check that the runner can get the graph.
        assert nx.is_isomorphic(g, r.get_networkx_graph(uri)) is True
