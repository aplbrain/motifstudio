import Link from "next/link";
import type { Metadata } from "next";
import { DocsNavbar } from "../../components/DocsNavbar";
import { CodeBlock } from "../../components/CodeBlock";

export const metadata: Metadata = {
    title: "Python Usage Docs",
};

const installCommand = `pip install motifstudio-client dotmotif pandas networkx`;

const listHostsExample = String.raw`from motifstudio_client import MotifStudioClient

client = MotifStudioClient()

# List available hosts
hosts = client.list_hosts()
print(hosts)`;

const motifSearchExample = String.raw`from motifstudio_client import MotifStudioClient
from dotmotif import Motif
import pandas as pd

client = MotifStudioClient()

triangle = """
bi_edge(a, b) {
    a -> b
    b -> a
}
bi_edge(A, B)
bi_edge(B, C)
bi_edge(C, A)
"""

try:
    Motif(triangle)
except Exception as e:
    print(f"Error compiling motif: {e}")

witvliet_triangles = client.find_motifs(
    host_id="Witvliet_1",
    motif=triangle,
)

print(witvliet_triangles.response_duration_ms)
print(pd.DataFrame(witvliet_triangles.motif_results))`;

const graphDownloadExample = String.raw`from motifstudio_client import MotifStudioClient
import networkx as nx

client = MotifStudioClient()

all_hosts = client.get_hosts()

print(all_hosts[0])

# Example: {'name': 'Kasthuri et al., 2015', 'id': 'Kasthuri2015'}

g = client.get_host(host_id=all_hosts[0]['id'])

print(nx.density(g))`;

export default function PythonDocsPage() {
    return (
        <div className="min-h-screen bg-gray-100 pb-20 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
            <DocsNavbar />

            <main className="mx-auto mt-8 w-full max-w-5xl px-6">
                <article className="space-y-10 rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                    <header className="space-y-4">
                        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                            Motif Studio Docs
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight">Python Usage</h1>
                        <p className="text-base leading-7 text-gray-600 dark:text-gray-300">
                            Script motif exploration workflows with the <span className="font-semibold">motifstudio_client</span>{" "}
                            library. These examples cover installation, host discovery, motif execution, and downloading
                            full graphs for offline analysis.
                        </p>
                        <p className="text-base leading-7 text-gray-600 dark:text-gray-300">
                            Client repository:{" "}
                            <Link
                                href="https://github.com/aplbrain/motifstudio_client"
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 underline decoration-blue-400 hover:text-blue-500 dark:text-blue-300 dark:hover:text-blue-200"
                            >
                                github.com/aplbrain/motifstudio_client
                            </Link>
                        </p>
                    </header>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold">Install the client</h2>
                        <p className="text-base leading-7 text-gray-600 dark:text-gray-300">
                            Install the core client and supporting libraries:
                        </p>
                        <CodeBlock code={installCommand} language="bash" height={120} />
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold">List available hosts</h2>
                        <p className="text-base leading-7 text-gray-600 dark:text-gray-300">
                            Instantiate the client and enumerate which hosts are available in your deployment.
                        </p>
                        <CodeBlock code={listHostsExample} />
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold">Compile and run motif searches</h2>
                        <p className="text-base leading-7 text-gray-600 dark:text-gray-300">
                            Validate your motif locally with DotMotif, execute it remotely, and inspect the returned data with
                            pandas.
                        </p>
                        <CodeBlock code={motifSearchExample} height={420} />
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold">Download graphs for local analysis</h2>
                        <p className="text-base leading-7 text-gray-600 dark:text-gray-300">
                            Pull a full graph to work with familiar tools such as NetworkX.
                        </p>
                        <CodeBlock code={graphDownloadExample} height={320} />
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold">More resources</h2>
                        <ul className="list-disc space-y-2 pl-6 text-base leading-7 text-gray-600 dark:text-gray-300">
                            <li>
                                <Link
                                    href="https://api.motifstudio.bossdb.org/docs"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 underline decoration-blue-400 hover:text-blue-500 dark:text-blue-300 dark:hover:text-blue-200"
                                >
                                    Motif Studio API reference
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="https://github.com/aplbrain/motifstudio"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 underline decoration-blue-400 hover:text-blue-500 dark:text-blue-300 dark:hover:text-blue-200"
                                >
                                    Motif Studio source repository
                                </Link>
                            </li>
                        </ul>
                    </section>
                </article>
            </main>
        </div>
    );
}
