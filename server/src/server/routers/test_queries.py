import json
from unittest.mock import Mock, patch

import pytest
from fastapi import HTTPException

from ...models import DownloadGraphQueryRequest, MotifParseQueryRequest, MotifQueryRequest
from .queries import _run_graph_operation, _serialize_graph, query_parse_motif
from ...host_provider.host_provider.host_provider import NetworkXHostProvider


def _commons():
    commons = Mock()
    commons.max_ram_bytes = 1024
    commons.max_duration_seconds = 5
    return commons


def test_graph_operation_uses_configured_limits():
    operation = Mock()
    with patch("src.server.routers.queries.run_with_limits", return_value=42) as run:
        assert _run_graph_operation(_commons(), operation, "graph") == 42

    run.assert_called_once_with(
        operation,
        args=("graph",),
        max_ram_bytes=1024,
        timeout_seconds=5,
    )


def test_graph_operation_returns_gateway_timeout():
    with patch("src.server.routers.queries.run_with_limits", side_effect=TimeoutError("too slow")):
        with pytest.raises(HTTPException) as error:
            _run_graph_operation(_commons(), Mock())

    assert error.value.status_code == 504


def test_graph_operation_returns_service_unavailable_for_memory_limit():
    with patch("src.server.routers.queries.run_with_limits", side_effect=MemoryError("too large")):
        with pytest.raises(HTTPException) as error:
            _run_graph_operation(_commons(), Mock())

    assert error.value.status_code == 503


def test_serialize_graph_writes_a_temporary_file():
    import os

    import networkx as nx

    path = _serialize_graph(nx.path_graph(3), "graphml")
    try:
        assert os.path.getsize(path) > 0
    finally:
        os.unlink(path)


def test_graph_download_defaults_to_graphml():
    assert DownloadGraphQueryRequest(host_id="graph").format == "graphml"


def test_graph_properties_loads_graph_once():
    import networkx as nx

    provider = NetworkXHostProvider()
    graph = nx.Graph()
    graph.add_edge("a", "b", weight=1)
    graph.nodes["a"]["kind"] = "source"
    provider.get_networkx_graph = Mock(return_value=graph)

    properties = provider.get_graph_properties("graph")

    provider.get_networkx_graph.assert_called_once_with("graph")
    assert properties == {
        "vertex_count": 2,
        "edge_count": 1,
        "vertex_attributes": {"kind": "str"},
        "edge_attributes": {"weight": "int"},
    }


def test_motif_query_limit_is_bounded():
    assert MotifQueryRequest(host_id="graph", query="A", limit=10).limit == 10
    with pytest.raises(ValueError):
        MotifQueryRequest(host_id="graph", query="A", limit=10001)


def test_motif_limit_preserves_total_count():
    import networkx as nx

    provider = NetworkXHostProvider()
    provider.get_networkx_graph = Mock(return_value=nx.path_graph(4))

    count, results = provider.get_motifs("graph", "A -- B", limit=2)

    assert count == 6
    assert len(results) == 2


def test_motif_aggregation_preserves_match_count():
    import networkx as nx

    provider = NetworkXHostProvider()
    provider.get_networkx_graph = Mock(return_value=nx.path_graph(4))

    count, results = provider.get_motifs("graph", "A -- B", aggregation_type="sample | {\"limit\": 2}")

    assert count == 6
    assert len(results) == 2


def test_motif_parse_uses_the_links_node_link_field():
    response = query_parse_motif(MotifParseQueryRequest(host_id="", query="A -> B"), _commons())
    motif_graph = json.loads(response.motif_nodelink_json)

    assert "links" in motif_graph
    assert "edges" not in motif_graph
    assert motif_graph["links"] == [
        {"exists": True, "action": "SYN", "constraints": {}, "source": "A", "target": "B", "key": 0}
    ]
