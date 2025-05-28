export const PRIMITIVES = {
    "recurrence": {
        "name": "Recurrence",
        "description": "Two vertices with reciprocal edges.",
        "dotmotif": `# Recurrent connection
recur(A, B) {
    A -> B
    B -> A
}`
    },
    "triangle": {
        "name": "Triangle",
        "description": "Three vertices with edges between each pair.",
        "dotmotif": `# Triangle motif
triangle(A, B, C) {
    A -> B
    B -> C
    C -> A
}`
    },
    "oneway": {
        "name": "One-way",
        "description": "A directed edge from one vertex to another.",
        "dotmotif": `# One-way connection
oneway(A, B) {
    A -> B
    B !> A
}`
    },
}