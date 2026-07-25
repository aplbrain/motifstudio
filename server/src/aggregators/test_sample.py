from .sample import MotifResultsSampleAggregator


def test_sample_limit_larger_than_results_returns_all_results():
    results = [{"A": "a"}, {"A": "b"}]

    assert sorted(MotifResultsSampleAggregator(limit=10).aggregate(results), key=lambda result: result["A"]) == results
