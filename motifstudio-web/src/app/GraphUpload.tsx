"use client";
import { useState, useCallback } from "react";
import { CloudArrowUpIcon, XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { BASE_URL, HostListing } from "./api";

interface UploadedGraph {
    temp_id: string;
    name: string;
    original_filename: string;
    file_size: number;
}

interface GraphUploadProps {
    onGraphUploaded?: (graph: HostListing) => void;
}

export function GraphUpload({ onGraphUploaded }: GraphUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>("");
    const [uploadedGraphs, setUploadedGraphs] = useState<UploadedGraph[]>([]);
    const [error, setError] = useState<string>("");

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    }, []);

    const handleFileUpload = async (file: File) => {
        setIsUploading(true);
        setError("");
        setUploadProgress("Uploading file...");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("name", file.name);

            const response = await fetch(`${BASE_URL}/uploads/graph`, {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                setUploadProgress("File uploaded successfully!");
                
                const uploadedGraph: UploadedGraph = {
                    temp_id: result.temp_id,
                    name: file.name,
                    original_filename: result.original_filename,
                    file_size: result.file_size,
                };
                
                setUploadedGraphs(prev => [...prev, uploadedGraph]);

                // Store in localStorage for persistence
                const storedGraphs = localStorage.getItem("motifstudio_uploaded_graphs");
                const existing = storedGraphs ? JSON.parse(storedGraphs) : [];
                const updated = [...existing, uploadedGraph];
                localStorage.setItem("motifstudio_uploaded_graphs", JSON.stringify(updated));

                setTimeout(() => setUploadProgress(""), 3000);
            } else {
                setError(result.error || "Upload failed");
            }
        } catch (err) {
            setError(`Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
            setIsUploading(false);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const removeUploadedGraph = (temp_id: string) => {
        setUploadedGraphs(prev => prev.filter(g => g.temp_id !== temp_id));
        
        // Update localStorage
        const storedGraphs = localStorage.getItem("motifstudio_uploaded_graphs");
        if (storedGraphs) {
            const existing = JSON.parse(storedGraphs);
            const updated = existing.filter((g: UploadedGraph) => g.temp_id !== temp_id);
            localStorage.setItem("motifstudio_uploaded_graphs", JSON.stringify(updated));
        }

        // Cleanup on server
        fetch(`${BASE_URL}/uploads/temporary/${temp_id}`, {
            method: "DELETE",
        }).catch(console.error);
    };

    // Load uploaded graphs from localStorage on component mount
    useState(() => {
        const storedGraphs = localStorage.getItem("motifstudio_uploaded_graphs");
        if (storedGraphs) {
            try {
                const parsed = JSON.parse(storedGraphs);
                setUploadedGraphs(parsed);
            } catch (err) {
                console.error("Failed to parse stored graphs:", err);
                localStorage.removeItem("motifstudio_uploaded_graphs");
            }
        }
    });

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging 
                        ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" 
                        : "border-gray-300 dark:border-gray-600"
                } ${isUploading ? "opacity-50 pointer-events-none" : "hover:border-gray-400 dark:hover:border-gray-500"}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {isUploading ? "Uploading..." : "Upload a graph file"}
                        </span>
                        <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept=".graphml,.gml,.gexf,.csv,.gz"
                            onChange={handleFileSelect}
                            disabled={isUploading}
                        />
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        or drag and drop
                    </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Supports GraphML, GEXF, GML, CSV (edgelist), and gzipped versions
                </p>
            </div>

            {/* Upload Progress */}
            {uploadProgress && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-blue-800 dark:text-blue-200">{uploadProgress}</span>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                    <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
                </div>
            )}

            {/* Uploaded Graphs List */}
            {uploadedGraphs.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Uploaded Graphs (click to select)
                    </h4>
                    <div className="space-y-2">
                        {uploadedGraphs.map((graph) => (
                            <div
                                key={graph.temp_id}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                onClick={() => {
                                    if (onGraphUploaded) {
                                        const hostListing: HostListing = {
                                            id: graph.temp_id,
                                            name: graph.name,
                                            uri: `temp://${graph.temp_id}`,
                                            provider: {"@id": "TemporaryGraphHostProvider"},
                                            volumetric_data: {}
                                        };
                                        onGraphUploaded(hostListing);
                                    }
                                }}
                            >
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {graph.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatFileSize(graph.file_size)} • {graph.original_filename}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent triggering the row click
                                        removeUploadedGraph(graph.temp_id);
                                    }}
                                    className="ml-4 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Remove uploaded graph"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
