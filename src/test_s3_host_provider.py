from .host_provider.router import S3GraphMLHostProvider


def test_can_create_s3_provider():
    s3r = S3GraphMLHostProvider(bucket="foo")
    assert s3r.accepts("s3://foo/bar.graphml") is True
    assert s3r.accepts("s3://nonmatchingbucket/bar") is False
    assert s3r.accepts("s3://nonmatchingbucket/bar.graphml") is False
