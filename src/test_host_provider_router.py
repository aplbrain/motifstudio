import tempfile
import networkx as nx
from .host_provider_router import HostProviderRouter, S3GraphMLHostProvider, FilesystemGraphMLHostProvider


def test_can_create_empty_router():
    """
    Test that we can create an empty router and that it has an empty map.

    """
    router = HostProviderRouter()
    assert router.runner_for("s3://foo") is None


def test_can_register_runner():
    """ """
    router = HostProviderRouter()
    sqr = S3GraphMLHostProvider(bucket="foo")
    router.add_runner(sqr)
    assert router.runner_for("s3://foo/bar.graphml") is sqr


def test_can_shadow_runner():
    """
    Yeah um this is intended behavior.

    Test that registering two providers that both match a URI results in the
    first runner being used.

    """
    run1 = S3GraphMLHostProvider(bucket="foo")
    run2 = S3GraphMLHostProvider(bucket="foo")
    router = HostProviderRouter()
    router.add_runner(run1)
    router.add_runner(run2)
    assert router.runner_for("s3://foo/bar.graphml") is run1


def test_can_create_router_with_providers():
    """
    Test that we can create a router with providers.

    """
    run1 = S3GraphMLHostProvider(bucket="foo")
    run1_shadow = S3GraphMLHostProvider(bucket="foo")
    run2 = S3GraphMLHostProvider(bucket="bar")
    router = HostProviderRouter(providers=[run1, run1_shadow, run2])
    assert router.runner_for("s3://foo/bar.graphml") is run1
    assert router.runner_for("s3://bar/foo.graphml.gz") is run2
    assert router.runner_for("s3://baz/baz.graphml.gz") is None


def test_can_resolve_host_fs_graphml():
    """
    Test that the runner can find and resolve a local graphml file.
    """
    with tempfile.NamedTemporaryFile(suffix=".graphml") as tmp:
        tmp.write(b"<graphml></graphml>")
        tmp.flush()
        router = HostProviderRouter()
        assert router.runner_for("file://" + tmp.name) is None
        runner = FilesystemGraphMLHostProvider()
        router.add_runner(runner)
        assert router.runner_for("file://" + tmp.name) is runner
