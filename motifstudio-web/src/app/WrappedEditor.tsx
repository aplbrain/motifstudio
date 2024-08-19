"use client";
import Editor from "@monaco-editor/react";

export const _DEFAULT_EDITOR_CONTENTS = `# This is a DotMotif editor.
# For more information, visit
# https://github.com/aplbrain/dotmotif

# Recurrence:
A -> B
B -> A

`;

export function WrappedEditor({
    startValue,
    entityNames,
    onChange,
}: {
    startValue?: string;
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
            defaultLanguage="motiflang"
            defaultValue={startValue || _DEFAULT_EDITOR_CONTENTS}
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
