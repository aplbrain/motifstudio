# Design Goals

...from the BossDB proposal:

> ### Aim 3 — Develop a discovery engine for comparative connectomics and cross-dataset querying
>
> Aim 3 will create a discovery engine to provide new data querying and searching capabilities on BossDB dataset annotations and metadata for structural, functional, cell-type, and genomic analyses. Versioned releases of annotations within our flexible annotation store will be materialized into community developed querying and visualization tools that are hosted by BossDB. BossDB datasets registered to community-developed brain atlases will facilitate cross-dataset querying, as well as secondary querying capabilities with data products in other community data archives and resources. This discovery engine will enable currently unavailable scientific workflows on more datasets, allowing novel analyses to be performed in more consistent and easily accessible queries originating either from BossDB or from other archives that can access BossDB data.

## Homogenization of data

Connectomes are commonly stored in a variety of formats, according to dataset and analysis needs. The goal of Motif Studio is to provide a common interface for storing and analyzing connectomes, and to provide tools for comparative connectomics and cross-dataset querying.

To achieve this, Motif Studio must expose a common set of "primitive" queries that can be used to build more complex queries. These queries should be able to be applied to any connectome, regardless of the format in which it is stored. These primitives are by necessity a subset of the queries that can be performed on any given connectome, but should be sufficient to perform most common analyses.

A complete set of primitives must include operations like:

-   Get the number of nodes in the connectome;
    -   ...grouped by cell type, region, etc.
-   Get the number of edges in the connectome
-   Get vertices and edges by their ID
-   Get paths from one vertex to another
-   Search for motif queries of known structure
-   Reduce motif queries to aggregate summary statistics;
    -   ...such as neuron cell type probability distributions

This set of primitive operations is handled by a `HostProvider`, an interface that uses existing APL BRAIN tools such as [Grand](https://github.com/aplbrain/grand) and [DotMotif](https://github.com/aplbrain/DotMotif) to abstract away the details of the underlying connectome format. HostProviders are responsible for translating the primitive operations into the appropriate queries for the underlying connectome format.

HostProviders might include GraphML, NetworkX, and OpenCypher (CSV) readers (a reasonable spanning set of graph formats currently in use by the connectomics community). Advanced HostProviders might include AWS Neptune or neuPrint adapters, which would allow Motif Studio to be used as a front-end for these services.

## Cross-dataset querying

The BossDB proposal also mentions the ability to perform cross-dataset querying. This is a more advanced feature that requires a common schema for connectome metadata. This schema should be flexible enough to allow for the inclusion of metadata from any connectome, but should also be sufficiently structured to allow for the creation of a common set of queries that can be applied to any connectome.

Because we can depend upon the homogenized query protocols introduced above, querying across datasets is a trivial matter, as the only parameter that changes is the HostProvider.

## Scaling to large datasets

Modern big-data connectomes exceed many hundreds of thousands of vertices, and millions of synapses. A core design principle of Motif Studio is that it should be able to scale to these large datasets without sacrificing performance. This is most easily done by allocating more resources to the host providers that service larger graphs. For example, while a hundred-node graph might live in a NetworkX host provider, a million-node graph might live in a Neptune host provider.

Critically, all queries should be able to be performed on any host provider, regardless of the size of the underlying graph. This is achieved by the use of a common set of primitives, as described above. Furthermore, it is intended that most queries will never be run exhaustively; instead, we anticipate most users will be interested in summary statistics or approximations, which can be computed in a streaming fashion.

We also intend to heavily leverage results-caching, which can be used to (1) avoid recomputation of expensive queries, and (2) allow for the use of partial results. Partial results can then be used to continue a long running query later on without having to recompute the entire query, or to serve as a starting point for a new query. For example, a search for all large motifs may be prohibitively expensive to run in a single session, but if mapped results for a subgraph of that motif has already been cached, the search can be started from a point of partial completion.

## Visualization

Motif Studio will deliberately reuse as much existing visualization software as possible from the extensive ecosystem, rather than developing new tools from scratch. This will improve user familiarity and reduce activation-energy.
