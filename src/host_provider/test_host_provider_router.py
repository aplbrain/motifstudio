import tempfile
from models import HostListing
from .router import HostProviderRouter, S3GraphMLHostProvider, FilesystemGraphMLHostProvider


def test_can_create_empty_router():
    """
    Test that we can create an empty router and that it has an empty map.

    """
    router = HostProviderRouter()
    assert router.provider_for("s3://foo") is None


def test_can_register_provider():
    """ """
    router = HostProviderRouter()
    sqr = S3GraphMLHostProvider(bucket="foo")
    router.add_provider(sqr)
    assert router.provider_for("s3://foo/bar.graphml") is sqr


def test_can_shadow_provider():
    """
    Yeah um this is intended behavior.

    Test that registering two providers that both match a URI results in the
    first provider being used.

    """
    run1 = S3GraphMLHostProvider(bucket="foo")
    run2 = S3GraphMLHostProvider(bucket="foo")
    router = HostProviderRouter()
    router.add_provider(run1)
    router.add_provider(run2)
    assert router.provider_for("s3://foo/bar.graphml") is run1


def test_can_create_router_with_providers():
    """
    Test that we can create a router with providers.

    """
    run1 = S3GraphMLHostProvider(bucket="foo")
    run1_shadow = S3GraphMLHostProvider(bucket="foo")
    run2 = S3GraphMLHostProvider(bucket="bar")
    router = HostProviderRouter(providers=[run1, run1_shadow, run2])
    assert router.provider_for("s3://foo/bar.graphml") is run1
    assert router.provider_for("s3://bar/foo.graphml.gz") is run2
    assert router.provider_for("s3://baz/baz.graphml.gz") is None


def test_can_resolve_host_fs_graphml():
    """
    Test that the provider can find and resolve a local graphml file.
    """
    with tempfile.NamedTemporaryFile(suffix=".graphml") as tmp:
        tmp.write(b"<graphml></graphml>")
        tmp.flush()
        router = HostProviderRouter()
        assert router.provider_for("file://" + tmp.name) is None
        provider = FilesystemGraphMLHostProvider()
        router.add_provider(provider)
        assert router.provider_for("file://" + tmp.name) is provider


def test_can_validate_host_uris():
    """
    HostProviderRouter#validate_all_hosts should return all() == True if all
    hosts are valid, and all() == False if any hosts are invalid.

    """
    assert (
        all(HostProviderRouter([FilesystemGraphMLHostProvider()]).validate_all_hosts(["cheese:///tmp/foo.graphml"]))
        == False
    ), "Should not validate cheese://"
    assert all(
        HostProviderRouter([FilesystemGraphMLHostProvider()]).validate_all_hosts(["file:///tmp/foo.graphml"])
    ), "Should successfully validate a list comprising only file://"
    assert (
        HostProviderRouter([FilesystemGraphMLHostProvider()]).validate_all_hosts(
            ["file:///tmp/foo.graphml", "cheese:///tmp/foo.graphml"]
        )
    ) == [True, False], "Should successfully validate a list comprising only file://"


def test_can_validate_hostlistings():
    """
    HostProviderRouter#validate_all_hosts can also accept HostListing objects.

    """

    invalid_host = HostListing(uri="cheese:///tmp/foo.graphml", name="Invalid Host")
    valid_host = HostListing(uri="file:///tmp/foo.graphml", name="Valid Host")
    assert (
        all(HostProviderRouter([FilesystemGraphMLHostProvider()]).validate_all_hosts([invalid_host])) == False
    ), "Should not validate cheese://"
    assert all(
        HostProviderRouter([FilesystemGraphMLHostProvider()]).validate_all_hosts([valid_host])
    ), "Should successfully validate a list comprising only file://"
    assert (HostProviderRouter([FilesystemGraphMLHostProvider()]).validate_all_hosts([valid_host, invalid_host])) == [
        True,
        False,
    ], "Should successfully validate a list comprising only file://"
