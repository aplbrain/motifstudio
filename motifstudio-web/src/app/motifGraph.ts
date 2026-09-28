type MotifNodeLinkGraph = {
    edges?: unknown;
    links?: unknown;
};

/** Return node-link edges from either NetworkX field name. */
export function getMotifGraphEdges(motifGraph: MotifNodeLinkGraph): unknown[] {
    const edges = motifGraph.edges ?? motifGraph.links ?? [];
    return Array.isArray(edges) ? edges : [];
}
