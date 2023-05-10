import json
from typing import Callable, Protocol, Any
import random

from .models import (
    _MotifResultsNonAggregated,
    _MotifResultsAggregatedHostVertex,
    _MotifResultsAggregatedMotifVertexAttribute,
)


class MotifResultsAggregator:
    """
    A base class for motif results aggregator functions.

    This class does no transformation to the results.

    """

    def __init__(self, **kwargs: Any):
        """
        Initialize the aggregator.

        """
        ...

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


# class MotifResultsMotifVertexAttributeAggregator(MotifResultsAggregator):
#     """
#     An aggregator that keeps track of the attributes of the host vertices for
#     each motif vertex. Useful for things like finding which cell type a motif
#     vertex is most often assigned to in the host vertex.

#     """

#     def aggregate(self, results: _MotifResultsNonAggregated) -> _MotifResultsAggregatedMotifVertexAttribute:
#         """
#         Aggregate results, grouping on host vertex.
#         """
#         attr_map: _MotifResultsAggregatedMotifVertexAttribute = {}
#         all_host_verts_for_attr =
#         for motif_mapping in results:


class MotifResultsSampleAggregator(MotifResultsAggregator):
    """
    An aggregator that just returns a sample of the motif mapping results.

    """

    def __init__(self, **kwargs: Any):
        """
        Kwargs should include `limit`.

        """
        print(kwargs)
        self._limit: int = kwargs.get("limit", 1)

    def aggregate(self, results: _MotifResultsNonAggregated) -> _MotifResultsNonAggregated:
        """
        Aggregate results, returning a random sample of the results.

        """
        return random.sample(results, self._limit)


class MotifAggregation:
    HostVertex = "host.vertex"
    MotifVertexAttribute = "motif.vertex.attribute"
    Sample = "sample"

    @classmethod
    def explain_valid(cls) -> list[str]:
        return [v for k, v in cls.__dict__.items() if not k.startswith("_") and isinstance(v, str)]

    @classmethod
    def parse_aggregation_args(cls, aggr_argument_string: str) -> dict:
        """
        Parse args of the form `aggr_type | { "arg1": "value1", "arg2": "value2" }`
        """
        if aggr_argument_string in [None, ""]:
            return {}
        if "|" not in aggr_argument_string:
            return {}
        aggr_args = aggr_argument_string.split("|")
        if len(aggr_args) != 2:
            return {}
        return json.loads("|".join(aggr_args[1:]))

    @classmethod
    def get_aggregator(cls, aggregator_string: str) -> Callable:
        if "|" in aggregator_string:
            aggregator_string = aggregator_string.split("|")[0].strip()
        if aggregator_string in [None, ""]:
            return MotifResultsAggregator
        if aggregator_string == cls.HostVertex:
            return MotifResultsHostVertexCountAggregator
        elif aggregator_string == cls.Sample:
            return MotifResultsSampleAggregator
        else:
            return None


__all__ = [
    "MotifAggregation",
]
