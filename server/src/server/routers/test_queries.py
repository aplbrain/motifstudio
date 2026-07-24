from unittest.mock import Mock, patch

import pytest
from fastapi import HTTPException

from .queries import _run_graph_operation, _serialize_graph


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
