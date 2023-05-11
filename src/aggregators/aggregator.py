from typing import Any
from ..models import _MotifResultsNonAggregated


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
