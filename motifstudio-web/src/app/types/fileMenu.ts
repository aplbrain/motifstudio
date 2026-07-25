import { HostListing } from "../api";

export interface SavedProject {
    id: string;
    name: string;
    queryText: string;
    queryType: "dotmotif" | "cypher";
    graph?: HostListing;
    timestamp: string;
}

export interface FileMenuProps {
    queryText: string;
    currentGraph?: HostListing;
    queryType: "dotmotif" | "cypher";
    onLoad: (data: { queryText: string; graph?: HostListing; queryType?: "dotmotif" | "cypher" }) => void;
}

export interface SaveDialogProps {
    isOpen: boolean;
    onClose: () => void;
    queryText: string;
    currentGraph?: HostListing;
    queryType: "dotmotif" | "cypher";
    savedProjects: SavedProject[];
    onSave: (project: SavedProject) => void;
}

export interface OpenDialogProps {
    isOpen: boolean;
    onClose: () => void;
    savedProjects: SavedProject[];
    onLoad: (project: SavedProject) => void;
    onDelete: (project: SavedProject) => void;
}

export interface DeleteConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    project: SavedProject | null;
    onConfirm: (projectId: string) => void;
}

export interface Primitive {
    name: string;
    description: string;
    dotmotif: string;
}

export interface PrimitivesMenuProps {
    onInsertPrimitive: (dotmotif: string) => void;
}
