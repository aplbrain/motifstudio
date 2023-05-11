import random
from typing import Any

from ..models import _MotifResultsNonAggregated
from .aggregator import MotifResultsAggregator


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
