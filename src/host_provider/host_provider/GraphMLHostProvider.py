import networkx as nx
from ...aggregators import MotifAggregation
from dotmotif import GrandIsoExecutor, Motif
from .host_provider import HostProvider
from ...models import PossibleMotifResultTypes


class GraphMLHostProvider(HostProvider):
    """
    A Host Provider that can handle local filesystem URIs and load GraphML
    files (either uncompressed or compressed with gzip).

    """

    def accepts(self, uri: str) -> bool:
        """
        Return True if the URI is a local filesystem URI.

        Arguments:
            uri (str): The URI to check.

        Returns:
            bool: True if the URI is a local filesystem URI GraphML file that
                ends with .graphml, .graphml.gz, or .gml.

        """
        return uri.endswith(".graphml") or uri.endswith(".graphml.gz") or uri.endswith(".gml")

    def get_networkx_graph(self, uri: str) -> nx.Graph:
        """
        Return a NetworkX graph for the URI.

        Arguments:
            uri (str): The URI of the host.

        Returns:
            nx.Graph: The NetworkX graph.

        """
        return nx.read_graphml(uri)  # type: ignore

    def get_vertex_count(self, uri: str) -> int:
        """
        Return the number of vertices in the graph.

        Arguments:
            uri (str): The URI of the host.

        Returns:
            int: The number of vertices in the graph.

        """
        return len(self.get_networkx_graph(uri).nodes)

    def get_vertex_attribute_schema(self, uri: str) -> dict[str, str]:
        """
        Return the schema of the vertex attributes in the graph.

        Arguments:
            uri (str): The URI of the host.

        Returns:
            dict[str, str]: The schema of the vertex attributes in the graph.

        """
        g = self.get_networkx_graph(uri)
        # TODO: This exhaustive search is no good for very large graphs.

        # Detect types of attributes, which may be different for different
        # vertices.
        attribute_types = {}
        for node in g.nodes:
            for attribute in g.nodes[node].keys():
                if attribute not in attribute_types:
                    attribute_types[attribute] = type(g.nodes[node][attribute]).__name__
                else:
                    if attribute_types[attribute] != type(g.nodes[node][attribute]).__name__:
                        attribute_types[attribute] = "str"
        return attribute_types

    def get_edge_count(self, uri: str) -> int:
        """
        Return the number of edges in the graph.

        Arguments:
            uri (str): The URI of the host.

        Returns:
            int: The number of edges in the graph.

        """
        return len(self.get_networkx_graph(uri).edges)

    def get_motif_count(self, uri: str, motif_string: str) -> int:
        """
        Count the number of instances of a motif in the graph.

        Arguments:
            uri (str): The URI of the host.
            motif_string (str): The motif to count.

        Returns:
            int: The number of instances of the motif.

        """
        motif = Motif(motif_string)
        graph = self.get_networkx_graph(uri)
        executor = GrandIsoExecutor(graph=graph)
        return executor.count(motif)

    def get_motifs(self, uri: str, motif_string: str, aggregation_type: str | None = None) -> PossibleMotifResultTypes:
        """
        Return the motifs in the graph.

        Optionally, transform the results using an aggregation from the
        MotifAggregation class.

        Arguments:
            uri (str): The URI of the host.
            motif_string (str): The motif to query.
            aggregation_type (str): The aggregation to use.

        Returns:
            PossibleMotifResultTypes: The results, optionally aggregated.

        """
        # Try to parse the motif string, and raise a ValueError if it's invalid
        # for syntax reasons or for validation reasons.
        try:
            motif = Motif(motif_string)
        except Exception as e:
            raise ValueError(f"Invalid motif: {motif_string}") from e

        # Read the aggregation type and arguments. The aggregation type is
        # optional, and if it's not provided, we'll use the default aggregation
        # type (which is to just return the results). The aggregation arguments
        # are in JSON format after a | delimiting character, and if they're not
        # provided, we'll use an empty dictionary.
        # All agg calls take kwargs in their constructor.
        parsed_agg_args = MotifAggregation.parse_aggregation_args(aggregation_type or "")
        aggregator = MotifAggregation.get_aggregator(aggregation_type or "")
        # Fail fast:
        if aggregator is None:
            raise ValueError(f"Invalid aggregation type: {aggregation_type}")

        # Get the graph, execute the query, and aggregate the results.
        graph = self.get_networkx_graph(uri)
        executor = GrandIsoExecutor(graph=graph)
        # The only "special" argument is limit. If we decide to have other
        # pre-processing arguments in the future, we will likely want to handle
        # them more explicitly.
        results = executor.find(motif, limit=parsed_agg_args.get("limit", None))
        return aggregator(**parsed_agg_args).aggregate(results)
