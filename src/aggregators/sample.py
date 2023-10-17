"""A sampler that returns a random subset of motif search results."""
import random
from typing import Any

from ..models import _MotifResultsNonAggregated
from .aggregator import MotifResultsAggregator


class MotifResultsSampleAggregator(MotifResultsAggregator):
    """An aggregator that just returns a sample of the motif mapping results."""

    def __init__(self, **kwargs: Any):
        """Kwargs should include `limit`.

        Returns:
            None

        """
        self._limit: int = kwargs.get("limit", 1)

    def aggregate(self, results: _MotifResultsNonAggregated) -> _MotifResultsNonAggregated:
        """Aggregate results, returning a random sample of the results.

        Arguments:
            results (_MotifResultsNonAggregated): The motif search results.

        Returns:
            _MotifResultsNonAggregated: A random sample of the motif search
                results.

        """
        return random.sample(results, self._limit)


__all__ = ["MotifResultsSampleAggregator"]
