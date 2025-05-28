"""A Host Provider that can handle temporarily uploaded graph files."""

import os
import tempfile
import uuid
import pandas as pd
import time
import json
from pathlib import Path
from typing import Dict, Optional, NamedTuple
from .SingleFileHostProvider import SingleFileGraphHostProvider
import networkx as nx


class TemporaryFileInfo(NamedTuple):
    """Information about a temporary file."""
    temp_id: str
    filepath: str
    original_filename: str
    created_at: float
    expires_at: float


class TemporaryGraphHostProvider(SingleFileGraphHostProvider):
    """A Host Provider that can handle temporarily uploaded graph files.

    Files are automatically expired after 14 days and cleaned up.
    """

    def __init__(self, temp_dir: Optional[str] = None, expiration_days: int = 14):
        """Initialize the provider.

        Arguments:
            temp_dir (str): The temporary directory for uploaded files.
                          If None, uses system temp directory.
            expiration_days (int): Number of days after which files expire (default: 14).

        Returns:
            None
        """
        self.temp_dir = temp_dir or tempfile.gettempdir()
        self.temp_dir = os.path.join(self.temp_dir, "motifstudio_uploads")
        os.makedirs(self.temp_dir, exist_ok=True)

        self.expiration_days = expiration_days
        self.expiration_seconds = expiration_days * 24 * 60 * 60

        # Keep track of uploaded files with metadata
        self._uploaded_files: Dict[str, TemporaryFileInfo] = {}

        # Load existing files from disk on startup
        self._load_existing_files()

        # Clean up expired files
        self._cleanup_expired_files()

    @property
    def type(self) -> str:
        """Return the type of the provider."""
        return "TemporaryGraphHostProvider"

    def accepts(self, uri: str) -> bool:
        """Return True if the URI is a temporary file URI."""
        if not uri.startswith("temp://"):
            return False

        # Extract the temp_id and check if it exists and is not expired
        temp_id = uri[7:]  # Remove "temp://" prefix
        if temp_id in self._uploaded_files:
            file_info = self._uploaded_files[temp_id]
            # Check if file has expired
            if time.time() > file_info.expires_at:
                # Clean up expired file
                self._cleanup_single_file(temp_id)
                return False
            return super().accepts(file_info.filepath) or file_info.filepath.endswith('.csv')

        return False  # Unknown temp ID

    def store_file(self, file_content: bytes, original_filename: str) -> str:
        """Store a file temporarily and return a temporary ID.

        Arguments:
            file_content (bytes): The content of the uploaded file.
            original_filename (str): The original filename.

        Returns:
            str: A temporary ID that can be used to reference the file.
        """
        # Generate a unique ID
        temp_id = str(uuid.uuid4())

        # Determine file extension from original filename
        file_ext = Path(original_filename).suffix
        if not file_ext:
            # Try to determine from content or default to .graphml
            file_ext = ".graphml"

        # Create the temporary file path
        temp_filename = f"{temp_id}{file_ext}"
        temp_filepath = os.path.join(self.temp_dir, temp_filename)

        # Write the file
        with open(temp_filepath, "wb") as f:
            f.write(file_content)

        # Calculate expiration time
        created_at = time.time()
        expires_at = created_at + self.expiration_seconds

        # Store the mapping with metadata
        file_info = TemporaryFileInfo(
            temp_id=temp_id,
            filepath=temp_filepath,
            original_filename=original_filename,
            created_at=created_at,
            expires_at=expires_at
        )
        self._uploaded_files[temp_id] = file_info

        # Save metadata to disk for persistence
        self._save_metadata()

        return temp_id

    def get_networkx_graph(self, uri: str) -> nx.Graph:
        """Return a NetworkX graph from a temporary URI.

        Arguments:
            uri (str): The URI of the graph (temp://temp_id).

        Returns:
            nx.Graph: The NetworkX graph.
        """
        if not uri.startswith("temp://"):
            raise ValueError(f"Invalid temporary URI: {uri}")

        temp_id = uri[7:]  # Remove "temp://" prefix

        if temp_id not in self._uploaded_files:
            raise FileNotFoundError(f"Temporary file not found for ID: {temp_id}")

        file_info = self._uploaded_files[temp_id]

        # Check if file has expired
        if time.time() > file_info.expires_at:
            self._cleanup_single_file(temp_id)
            raise FileNotFoundError(f"Temporary file has expired for ID: {temp_id}")

        if not os.path.exists(file_info.filepath):
            raise FileNotFoundError(f"Temporary file does not exist: {file_info.filepath}")

        # Handle CSV files (assuming edgelist format)
        if file_info.filepath.endswith('.csv'):
            return self._read_csv_edgelist(file_info.filepath)

        return super().get_networkx_graph(file_info.filepath)

    def _read_csv_edgelist(self, filepath: str) -> nx.Graph:
        """Read a CSV file as an edgelist and convert to NetworkX graph.

        Arguments:
            filepath (str): Path to the CSV file.

        Returns:
            nx.Graph: The NetworkX graph.
        """
        try:
            # Try to read as CSV
            df = pd.read_csv(filepath)

            # Assume first two columns are source and target
            if len(df.columns) < 2:
                raise ValueError("CSV file must have at least 2 columns for source and target nodes")

            # Create graph from edgelist
            G = nx.Graph()

            # Get column names
            source_col = df.columns[0]
            target_col = df.columns[1]

            # Add edges
            for _, row in df.iterrows():
                source = row[source_col]
                target = row[target_col]

                # Add edge with any additional attributes
                edge_attrs = {}
                for col in df.columns[2:]:
                    edge_attrs[col] = row[col]

                G.add_edge(source, target, **edge_attrs)

            return G

        except Exception as e:
            # If CSV reading fails, try as plain text edgelist
            try:
                return nx.read_edgelist(filepath, delimiter=',')
            except Exception:
                raise ValueError(f"Failed to read CSV file as edgelist: {str(e)}")

    def cleanup_file(self, temp_id: str) -> bool:
        """Clean up a temporary file.

        Arguments:
            temp_id (str): The temporary ID of the file to clean up.

        Returns:
            bool: True if the file was successfully cleaned up.
        """
        if temp_id not in self._uploaded_files:
            return False

        file_info = self._uploaded_files[temp_id]

        try:
            if os.path.exists(file_info.filepath):
                os.remove(file_info.filepath)
            del self._uploaded_files[temp_id]
            self._save_metadata()
            return True
        except Exception:
            return False

    def list_temporary_files(self) -> Dict[str, Dict[str, str]]:
        """List all temporary files.

        Returns:
            Dict[str, Dict[str, str]]: A mapping of temp_id to file information.
        """
        result = {}
        for temp_id, file_info in self._uploaded_files.items():
            # Skip expired files
            if time.time() > file_info.expires_at:
                continue
            result[temp_id] = {
                "original_filename": file_info.original_filename,
                "filepath": file_info.filepath,
                "created_at": str(file_info.created_at),
                "expires_at": str(file_info.expires_at)
            }
        return result

    def get_file_info(self, temp_id: str) -> Optional[Dict[str, str]]:
        """Get information about a temporary file.

        Arguments:
            temp_id (str): The temporary ID.

        Returns:
            Optional[Dict[str, str]]: File information or None if not found.
        """
        if temp_id not in self._uploaded_files:
            return None

        file_info = self._uploaded_files[temp_id]

        # Check if file has expired
        if time.time() > file_info.expires_at:
            self._cleanup_single_file(temp_id)
            return None

        if not os.path.exists(file_info.filepath):
            return None

        stat = os.stat(file_info.filepath)
        return {
            "temp_id": temp_id,
            "filepath": file_info.filepath,
            "original_filename": file_info.original_filename,
            "filename": os.path.basename(file_info.filepath),
            "size": str(stat.st_size),
            "created_at": str(file_info.created_at),
            "expires_at": str(file_info.expires_at)
        }

    def _load_existing_files(self):
        """Load existing temporary files from disk metadata."""
        metadata_file = os.path.join(self.temp_dir, "metadata.json")

        if not os.path.exists(metadata_file):
            return

        try:
            with open(metadata_file, "r") as f:
                data = json.load(f)

            for temp_id, file_data in data.items():
                # Verify the file still exists
                if os.path.exists(file_data["filepath"]):
                    file_info = TemporaryFileInfo(
                        temp_id=temp_id,
                        filepath=file_data["filepath"],
                        original_filename=file_data["original_filename"],
                        created_at=file_data["created_at"],
                        expires_at=file_data["expires_at"]
                    )
                    self._uploaded_files[temp_id] = file_info

        except (json.JSONDecodeError, KeyError, OSError) as e:
            print(f"Warning: Failed to load temporary files metadata: {e}")

    def _save_metadata(self):
        """Save metadata about temporary files to disk."""
        metadata_file = os.path.join(self.temp_dir, "metadata.json")

        try:
            data = {}
            for temp_id, file_info in self._uploaded_files.items():
                data[temp_id] = {
                    "filepath": file_info.filepath,
                    "original_filename": file_info.original_filename,
                    "created_at": file_info.created_at,
                    "expires_at": file_info.expires_at
                }

            with open(metadata_file, "w") as f:
                json.dump(data, f, indent=2)

        except OSError as e:
            print(f"Warning: Failed to save temporary files metadata: {e}")

    def _cleanup_expired_files(self):
        """Clean up expired temporary files."""
        current_time = time.time()
        expired_ids = []

        for temp_id, file_info in self._uploaded_files.items():
            if current_time > file_info.expires_at:
                expired_ids.append(temp_id)

        for temp_id in expired_ids:
            self._cleanup_single_file(temp_id)

        # Save metadata after cleanup
        if expired_ids:
            self._save_metadata()

    def _cleanup_single_file(self, temp_id: str):
        """Clean up a single temporary file without saving metadata."""
        if temp_id not in self._uploaded_files:
            return

        file_info = self._uploaded_files[temp_id]

        try:
            if os.path.exists(file_info.filepath):
                os.remove(file_info.filepath)
        except OSError as e:
            print(f"Warning: Failed to remove temporary file {file_info.filepath}: {e}")

        del self._uploaded_files[temp_id]
