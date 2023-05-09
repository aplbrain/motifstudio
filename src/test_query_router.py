from .query_router import QueryRouter, S3QueryRunner


def test_can_create_empty_router():
    """
    Test that we can create an empty router and that it has an empty map.

    """
    router = QueryRouter()
    assert router.runner_for("s3://foo") is None


def test_can_register_prefix():
    """ """
    router = QueryRouter()
    sqr = S3QueryRunner(bucket="foo")
    router.add_runner(sqr)
    assert router.runner_for("s3://foo/bar") is sqr
