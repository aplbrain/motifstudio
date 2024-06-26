import tempfile
import networkx as nx
from . import FilesystemGraphHostProvider


def test_can_create_provider_from_path():
    # Create a temporary file graphml.
    g = nx.fast_gnp_random_graph(10, 0.1)  # type: ignore
    with tempfile.NamedTemporaryFile(suffix=".graphml") as f:
        nx.write_graphml(g, f.name)  # type: ignore
        # Create a provider from the path.
        uri = "file://" + f.name
        r = FilesystemGraphHostProvider()
        # Check that the provider accepts the path.
        assert r.accepts(uri) is True
        # Check that the provider can get the graph.
        assert nx.is_isomorphic(g, r.get_networkx_graph(uri)) is True


def test_can_count_motifs():
    # Create dense graph K4:
    g = nx.complete_graph(4, create_using=nx.DiGraph)  # type: ignore
    with tempfile.NamedTemporaryFile(suffix=".graphml") as f:
        nx.write_graphml(g, f.name)  # type: ignore
        # Create a provider from the path.
        uri = "file://" + f.name
        r = FilesystemGraphHostProvider()
        # Query the provider for the motif count.
        assert r.get_motif_count(uri, "A->B") == 12
