"""A host provider that can handle S3 URIs pointing to GraphML files."""
import tempfile
import boto3
from .SingleFileHostProvider import SingleFileGraphHostProvider
import networkx as nx


class S3GraphMLHostProvider(SingleFileGraphHostProvider):
    """A Host Provider that can handle S3 URIs."""

    def __init__(self, bucket: str, s3_client=None, cache: bool = True):
        """Initialize the provider.

        Arguments:
            bucket (str): The S3 bucket to use.
            s3_client (boto3.client): An optional S3 client to use.
            cache (bool): Whether to cache graphs in a temporary file.

        Returns:
            None

        """
        self.bucket = bucket
        self.s3_client = s3_client or boto3.client("s3")
        self._cache_dir = tempfile.TemporaryDirectory() if cache else None

    @property
    def type(self) -> str:
        """Return the type of the provider."""
        return "S3GraphMLHostProvider"

    def accepts(self, uri: str) -> bool:
        """Return True if the URI is an S3 URI."""
        return uri.startswith(f"s3://{self.bucket}/") and super().accepts(uri)

    def get_networkx_graph(self, uri: str) -> nx.Graph:
        """Return a NetworkX graph from a URI.

        Arguments:
            uri (str): The URI of the graph.

        Returns:
            nx.Graph: The NetworkX graph.

        """
        # Save the graph to a temporary file, then read it back in.
        # This is a workaround for NetworkX, which cannot read from file-likes.
        uri_without_scheme = uri.split("://")[-1].replace("/", "___")
        if self._cache_dir is None:
            # No caching, just download and return
            with tempfile.NamedTemporaryFile() as f:
                self.s3_client.download_file(self.bucket, uri[len(f"s3://{self.bucket}/") :], f.name)
                return super().get_networkx_graph(f.name)
        else:
            # Cache the graph in a temporary file, so we don't re-download:
            _cache_path = f"{self._cache_dir.name}/{uri_without_scheme}"
            try:
                return super().get_networkx_graph(_cache_path)
            except FileNotFoundError:
                self.s3_client.download_file(self.bucket, uri[len(f"s3://{self.bucket}/") :], _cache_path)
                return super().get_networkx_graph(_cache_path)
