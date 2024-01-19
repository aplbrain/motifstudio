"""The MotifAggregation class is a container class for result aggregation types."""

import json
from typing import Callable

from .aggregator import MotifResultsAggregator
from .sample import MotifResultsSampleAggregator
from .vertex_count import (
    MotifResultsHostVertexCountAggregator,
    MotifResultsMotifVertexCountAggregator,
)


class MotifAggregation:
    """A container class for motif-search aggregation types.

    The following aggregation types are supported:

    - `host.vertex`: Returns a mapping of each host vertex and how many times
      it was matched to each motif vertex:

      ```
      {
        "H1": { "M1": 1, "M2": 2, "M3": 1 },
        "H2": { "M1": 1, "M2": 1, "M3": 1 },
        ...
      }
      ```

    - `motif.vertex | {"attribute": str}`: Returns a mapping of each motif
      vertex and how many times it was matched to a host vertex of the
      specified attribute:

      ```
      {
        "M1": { "Host_Type1": 2, "Host_Type2": 1 },
        "M2": { "Host_Type1": 2, "Host_Type7": 1, "Host_Type8": 1 },
        ...
      }
      ```
    """

    HostVertex = "host.vertex"
    MotifVertex = "motif.vertex"
    MotifVertexAttribute = "motif.vertex.attribute"
    Sample = "sample"

    @classmethod
    def explain_valid(cls) -> list[str]:
        """Return a list of valid aggregation types."""
        return [v for k, v in cls.__dict__.items() if not k.startswith("_") and isinstance(v, str)]

    @classmethod
    def parse_aggregation_args(cls, aggr_argument_string: str) -> dict:
        """Parse args of the form `aggr_type | { "arg1": "value1", "arg2": "value2" }`."""
        if aggr_argument_string in [None, ""]:
            return {}
        if "|" not in aggr_argument_string:
            return {}
        aggr_args = aggr_argument_string.split("|")
        if len(aggr_args) != 2:
            return {}
        return json.loads("|".join(aggr_args[1:]))

    @classmethod
    def get_aggregator(cls, aggregator_string: str) -> Callable | None:
        """Return the aggregator function for the given aggregator string."""
        if "|" in aggregator_string:
            aggregator_string = aggregator_string.split("|")[0].strip()
        if aggregator_string in [None, ""]:
            return MotifResultsAggregator
        if aggregator_string == cls.HostVertex:
            return MotifResultsHostVertexCountAggregator
        elif aggregator_string == cls.MotifVertex:
            return MotifResultsMotifVertexCountAggregator
        elif aggregator_string == cls.Sample:
            return MotifResultsSampleAggregator
        else:
            return None


__all__ = ["MotifAggregation"]
