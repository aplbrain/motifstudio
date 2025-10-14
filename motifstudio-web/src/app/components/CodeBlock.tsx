"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface CodeBlockProps {
    code: string;
    language?: string;
    height?: number;
}

export function CodeBlock({ code, language = "python", height = 260 }: CodeBlockProps) {
    const editorOptions = useMemo(
        () => ({
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: "on" as const,
            wrappingIndent: "same" as const,
            wordWrap: "on" as const,
        }),
        []
    );

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-gray-700">
            <MonacoEditor
                theme="vs-dark"
                language={language}
                height={height}
                value={code}
                options={editorOptions}
            />
        </div>
    );
}
