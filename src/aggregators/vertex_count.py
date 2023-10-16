from ..models import (
    _MotifResultsNonAggregated,
    _MotifResultsAggregatedHostVertex,
    _MotifResultsAggregatedMotifVertex,
)
from .aggregator import MotifResultsAggregator


class MotifResultsHostVertexCountAggregator(MotifResultsAggregator):
    """
    An aggregator that counts the number of times each host vertex was assigned
    to each motif vertex.

    """

    def aggregate(
        self, results: _MotifResultsNonAggregated
    ) -> _MotifResultsAggregatedHostVertex:
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


class MotifResultsMotifVertexCountAggregator(MotifResultsAggregator):
    """
    An aggregator that counts the number of times each motif vertex is assigned
    to each host vertex.

    """

    def aggregate(
        self, results: _MotifResultsNonAggregated
    ) -> _MotifResultsAggregatedMotifVertex:
        """
        Aggregate results, grouping on motif vertex.
        """
        motif_verts: _MotifResultsAggregatedMotifVertex = {}
        for motif_mapping in results:
            for motif_vertex_id, host_vertex_id in motif_mapping.items():
                motif_verts.setdefault(motif_vertex_id, {})
                motif_verts[motif_vertex_id].setdefault(host_vertex_id, 0)
                motif_verts[motif_vertex_id][host_vertex_id] += 1
        return motif_verts
