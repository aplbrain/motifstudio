from typing import Protocol, Any

from .models import _MotifResultsNonAggregated, _MotifResultsAggregatedHostVertex


class MotifResultsAggregator(Protocol):
    """
    A base protocol for motif results aggregator functions.

    """

    def aggregate(self, results: _MotifResultsNonAggregated) -> Any:
        """
        Aggregate the results.

        """
        return results

    def __call__(self, results: _MotifResultsNonAggregated) -> Any:
        """
        Aggregate the results.

        """
        return self.aggregate(results)


class MotifResultsHostVertexCountAggregator(MotifResultsAggregator):
    """
    An aggregator that counts the number of times each host vertex was assigned
    to each motif vertex.

    """

    def aggregate(self, results: _MotifResultsNonAggregated) -> _MotifResultsAggregatedHostVertex:
        """
        Aggregate results, grouping on host vertex.
        """
        host_verts: _MotifResultsAggregatedHostVertex = {}
        for motif_mapping in results:
            for motif_vertex_id, host_vertex_id in motif_mapping.items():
                host_verts.setdefault(host_vertex_id, {})
                host_verts[host_vertex_id].setdefault(motif_vertex_id, 0)
                host_verts[host_vertex_id][motif_vertex_id] += 1
        return host_verts


__all__ = [
    "MotifResultsAggregator",
    "MotifResultsHostVertexCountAggregator",
]
