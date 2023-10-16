import tempfile
import boto3
from .GraphMLHostProvider import GraphMLHostProvider
import networkx as nx


class S3GraphMLHostProvider(GraphMLHostProvider):
    """
    A Host Provider that can handle S3 URIs.

    """

    def __init__(self, bucket: str, s3_client=None):
        self.bucket = bucket
        self.s3_client = s3_client or boto3.client("s3")

    @property
    def type(self) -> str:
        """
        Return the type of the provider.

        """
        return "S3GraphMLHostProvider"

    def accepts(self, uri: str) -> bool:
        """
        Return True if the URI is an S3 URI.

        """
        return uri.startswith(f"s3://{self.bucket}/") and super().accepts(uri)

    def get_networkx_graph(self, uri: str) -> nx.Graph:
        # Save the graph to a temporary file, then read it back in.
        # This is a workaround for NetworkX, which prevents reading from a
        # file-like object.
        with tempfile.NamedTemporaryFile() as f:
            self.s3_client.download_file(
                self.bucket, uri[len(f"s3://{self.bucket}/") :], f.name
            )
            return super().get_networkx_graph(f.name)
