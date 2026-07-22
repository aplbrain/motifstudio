import time

import pytest

from .commons import run_with_limits


def _large_result():
    return b"x" * (4 * 1024 * 1024)


def _raise_error():
    raise ValueError("query failed")


def _sleep():
    time.sleep(1)


def test_run_with_limits_returns_large_results():
    assert run_with_limits(_large_result, timeout_seconds=5) == _large_result()


def test_run_with_limits_propagates_errors():
    with pytest.raises(ValueError, match="query failed"):
        run_with_limits(_raise_error, timeout_seconds=5)


def test_run_with_limits_terminates_timed_out_processes():
    with pytest.raises(TimeoutError):
        run_with_limits(_sleep, timeout_seconds=0.05)
