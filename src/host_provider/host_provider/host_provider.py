from typing import Protocol

from ...models import PossibleMotifResultTypes, AttributeSchema


class HostProvider(Protocol):
    """
    A Host Provider is a class that can execute a query on a host network and
    return the results.

    """

    @property
    def type(self) -> str:
        """
        Return the type of the provider.

        This is a string representation that can be used to identify the
        provider in a config file.

        """
        raise NotImplementedError()

    def accepts(self, uri: str) -> bool:
        """
        Return True if this provider can handle the URI.

        Accept calls should run quickly and do minimal work so that the router
        can quickly find the correct provider.

        Arguments:
            uri (str): The URI to check.

        Returns:
            bool: True if the provider can handle the URI.

        """
        raise NotImplementedError()

    def get_vertex_count(self, uri: str) -> int:
        """
        Return the number of vertices in the graph.

        Arguments:
            uri (str): The URI of the host.

        Returns:
            int: The number of vertices in the graph.

        """
        ...

    def get_vertex_attribute_schema(self, uri: str) -> AttributeSchema:
        """
        Return the schema of the vertex attributes in the graph.

        Arguments:
            uri (str): The URI of the host.

        Returns:
            dict[str, str]: The schema of the vertex attributes in the graph.

        """
        ...

    def get_edge_count(self, uri: str) -> int:
        """
        Return the number of edges in the graph.

        Arguments:
            uri (str): The URI of the host.

        Returns:
            int: The number of edges in the graph.

        """
        ...

    def get_motif_count(self, uri: str, motif_string: str) -> int:
        """
        Get a count of motifs in the graph.

        Arguments:
            uri (str): The URI of the host.

        Returns:
            int: The count of the given motif.

        """
        ...

    def get_motifs(self, uri: str, motif_string: str, aggregation_type: str | None = None) -> PossibleMotifResultTypes:
        """
        Get the motifs in the graph.

        Optionally, transform the results using an aggregation from the
        MotifAggregation class.

        Arguments:
            uri (str): The URI of the host.
            motif_string (str): The motif to query.
            aggregation_type (str): The aggregation to use.

        Returns:
            PossibleMotifResultTypes: The results, optionally aggregated.

        """
        ...


__all__ = [
    "HostProvider",
]
