import { useState, useEffect } from "react";
import { SavedProject } from "../types/fileMenu";

const STORAGE_KEY = "motifstudio-projects";

export function useLocalStorage() {
    const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);

    useEffect(() => {
        // Load from localStorage on mount
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(STORAGE_KEY);
            setSavedProjects(saved ? JSON.parse(saved) : []);
        }
    }, []);

    const saveProject = (project: SavedProject) => {
        // Check if a project with this name already exists
        const existingProjectIndex = savedProjects.findIndex((p) => p.name === project.name);

        const updatedProject: SavedProject = {
            ...project,
            id: existingProjectIndex >= 0 ? savedProjects[existingProjectIndex].id : Date.now().toString(),
            timestamp: new Date().toISOString(),
        };

        let updatedProjects: SavedProject[];
        if (existingProjectIndex >= 0) {
            // Replace existing project
            updatedProjects = [...savedProjects];
            updatedProjects[existingProjectIndex] = updatedProject;
        } else {
            // Add new project
            updatedProjects = [updatedProject, ...savedProjects];
        }

        setSavedProjects(updatedProjects);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
        return updatedProject;
    };

    const deleteProject = (projectId: string) => {
        const updatedProjects = savedProjects.filter((p) => p.id !== projectId);
        setSavedProjects(updatedProjects);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
    };

    const projectExists = (name: string): boolean => {
        return savedProjects.some((p) => p.name === name);
    };

    return {
        savedProjects,
        saveProject,
        deleteProject,
        projectExists,
    };
}
