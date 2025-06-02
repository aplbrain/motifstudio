"use client";
import Editor from "@monaco-editor/react";

export const _DEFAULT_EDITOR_CONTENTS = `# This is a DotMotif editor.
# For more information, visit
# https://github.com/aplbrain/dotmotif

# Recurrence:
A -> B
B -> A

`;

export const _DEFAULT_CYPHER_CONTENTS = `// This is a Cypher query editor.
// For more information about Cypher, visit
// https://neo4j.com/docs/cypher-manual/current/

// Find paths of length 2:
MATCH (a)-[r1]->(b)-[r2]->(c)
RETURN a, b, c
LIMIT 100

`;

export function WrappedEditor({
    startValue,
    queryType = "dotmotif",
    entityNames,
    onChange,
}: {
    startValue?: string;
    queryType?: "dotmotif" | "cypher";
    entityNames?: string[];
    onChange?: (value?: string) => void;
}) {
    const variableEntityNames = entityNames || [];
    // const monacoRef = useRef(null);
    function handleEditorWillMount(monaco: any) {
        // here is the monaco instance
        // do something before editor is mounted
        monaco.languages.register({ id: "motiflang" });

        // Register a tokens provider for the language
        monaco.languages.setMonarchTokensProvider("motiflang", {
            tokenizer: {
                root: [
                    [/#.*$/, "comment"],
                    [/\b[><=!]{1,2}\b/, "operator"],
                    [/[-~!][>|]/, "edge"],
                    [/\w+/, "entity"],
                    [/\w+\(.*/, "macro"],
                ],
            },
        });

        // Register Cypher language support
        monaco.languages.register({ id: "cypher" });
        monaco.languages.setMonarchTokensProvider("cypher", {
            tokenizer: {
                root: [
                    [/\/\/.*$/, "comment"],
                    [/\/\*[\s\S]*?\*\//, "comment"],
                    [
                        /\b(MATCH|RETURN|WHERE|WITH|UNWIND|CREATE|DELETE|SET|REMOVE|MERGE|FOREACH|CALL|YIELD|UNION|ORDER BY|SKIP|LIMIT|AS|DISTINCT|OPTIONAL|NOT|AND|OR|XOR|IN|STARTS WITH|ENDS WITH|CONTAINS|IS NULL|IS NOT NULL|TRUE|FALSE|NULL)\b/i,
                        "keyword",
                    ],
                    [
                        /\b(count|sum|avg|min|max|collect|size|length|type|id|properties|keys|labels|nodes|relationships|range|reduce|filter|extract|all|any|none|single|exists|head|last|tail|reverse|sort)\b/i,
                        "function",
                    ],
                    [/\([^)]*\)/, "variable"],
                    [/\[[^\]]*\]/, "relationship"],
                    [/\{[^}]*\}/, "property"],
                    [/[<>-]+/, "edge"],
                    [/"([^"\\]|\\.)*"/, "string"],
                    [/'([^'\\]|\\.)*'/, "string"],
                    [/\d+/, "number"],
                    [/\w+/, "identifier"],
                ],
            },
        });

        // Define a new theme that contains only rules that match this language
        monaco.editor.defineTheme("motiftheme", {
            base: "vs",
            inherit: false,
            rules: [
                {
                    token: "operator",
                    foreground: "ff0000",
                    fontStyle: "bold",
                },
                {
                    token: "edge",
                    foreground: "0066dd",
                    fontStyle: "bold",
                },
                { token: "entity", foreground: "008800" },
                { token: "macro", foreground: "888800" },
                // Cypher tokens
                { token: "keyword", foreground: "0000ff", fontStyle: "bold" },
                { token: "function", foreground: "800080" },
                { token: "variable", foreground: "008800" },
                { token: "relationship", foreground: "0066dd" },
                { token: "property", foreground: "888800" },
                { token: "string", foreground: "dd0000" },
                { token: "number", foreground: "ff6600" },
                { token: "identifier", foreground: "000000" },
            ],
            colors: {
                "editor.foreground": "#888888",
            },
        });
        monaco.editor.defineTheme("motiftheme-dark", {
            base: "vs-dark",
            inherit: false,
            rules: [
                {
                    token: "operator",
                    foreground: "ff0000",
                    fontStyle: "bold",
                },
                {
                    token: "edge",
                    foreground: "0066dd",
                    fontStyle: "bold",
                },
                { token: "entity", foreground: "008800" },
                { token: "macro", foreground: "888800" },
                // Cypher tokens
                { token: "keyword", foreground: "4fc3f7", fontStyle: "bold" },
                { token: "function", foreground: "ce93d8" },
                { token: "variable", foreground: "81c784" },
                { token: "relationship", foreground: "64b5f6" },
                { token: "property", foreground: "fff176" },
                { token: "string", foreground: "f48fb1" },
                { token: "number", foreground: "ffab40" },
                { token: "identifier", foreground: "ffffff" },
            ],
            colors: {
                "editor.foreground": "#888888",
                "editor.background": "#1f2937",
            },
        });

        // Set of variable entity names that can be auto-completed:
        // const variableEntityNames = ["A", "B"];
        monaco.languages.registerCompletionItemProvider("motiflang", {
            provideCompletionItems: () => {
                return {
                    suggestions: variableEntityNames.map((name) => ({
                        label: name,
                        kind: monaco.languages.CompletionItemKind.Field,
                        insertText: name,
                    })),
                };
            },
        });
    }

    const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

    const getDefaultContent = () => {
        if (queryType === "cypher") {
            return _DEFAULT_CYPHER_CONTENTS;
        }
        return _DEFAULT_EDITOR_CONTENTS;
    };

    const getLanguage = () => {
        if (queryType === "cypher") {
            return "cypher";
        }
        return "motiflang";
    };

    return (
        <Editor
            height="40vh"
            theme={prefersDark ? "motiftheme-dark" : "motiftheme"}
            beforeMount={handleEditorWillMount}
            onChange={(value, event) => {
                if (onChange) {
                    onChange(value);
                }
            }}
            onMount={(editor, monaco) => {
                onChange ? onChange(editor.getValue()) : null;
            }}
            defaultLanguage={getLanguage()}
            language={getLanguage()}
            value={startValue || getDefaultContent()}
            options={{
                fontSize: 16,
                fontLigatures: true,
                minimap: {
                    enabled: false,
                },
            }}
        />
    );
}
