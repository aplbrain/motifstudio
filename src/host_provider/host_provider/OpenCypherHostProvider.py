import dask.dataframe as dd
import numpy as np
import pathlib
from typing import Any, List, Union
import networkx as nx

FilePointer = Union[str, pathlib.Path]


def get_opencypher_dtype(dtype: Any) -> str:
    """
    Convert a Polars data type to an openCypher data type.

    """
    if dtype in [bool, "bool"]:
        return "Boolean"
    elif dtype in [int, "int", "int64"]:
        return "Long"
    elif dtype in ["int32", "int16", "int8"]:
        return "Int"
    elif dtype in [float, "float"]:
        return "Float"
    elif dtype in [str, "str"]:
        return "String"
    elif dtype in ["date"]:
        return "DateTime"
    return "String"


class CSVOpenCypherConverter:
    """
    A converter that takes CSV files and converts them to openCypher-
    compatible importable files.

    ```
    cvt = CSVOpenCypherConverter(
        vertex_file="allen_soma_coarse_cell_class_model_v1.csv",
        edge_file="synapses_pni_2.csv",
        # vertex_file_id_column="id",
        vertex_file_id_column="pt_root_id",
        edge_file_source_column="pre_pt_root_id",
        edge_file_target_column="post_pt_root_id",
        edge_drop_remaining=True,
        out_directory="opencypher"
    )
    ```

    """

    def __init__(
        self,
        vertex_file: Union[FilePointer, List[FilePointer]],
        edge_file: Union[FilePointer, List[FilePointer]],
        vertex_file_id_column: str = "id",
        edge_file_source_column: str = "source",
        edge_file_target_column: str = "target",
        vertex_type: str = "Vertex",
        edge_type: str = "Edge",
        edge_drop_remaining: bool = True,
    ):
        """
        Create a new converter.

        The vertex_file or edge_file arguments may be either a single path to
        a file, or a list of paths to files. If a list is provided, the files
        will be imported in the order they are given.

        """
        self._vertex_file_paths = (
            [pathlib.Path(vertex_file) for vertex_file in vertex_file]
            if isinstance(vertex_file, list)
            else [pathlib.Path(vertex_file)]
        )

        self._edge_file_paths = (
            [pathlib.Path(edge_file) for edge_file in edge_file]
            if isinstance(edge_file, list)
            else [pathlib.Path(edge_file)]
        )

        # Make sure all the files exist
        for file_path in self._vertex_file_paths + self._edge_file_paths:
            if not file_path.exists() or not file_path.is_file():
                raise FileNotFoundError(file_path)

        self._vertex_file_id_column = vertex_file_id_column
        self._edge_file_source_column = edge_file_source_column
        self._edge_file_target_column = edge_file_target_column
        self._vertex_type = vertex_type
        self._edge_type = edge_type
        self._edge_drop_remaining = edge_drop_remaining

    def _get_vertex_df(self):
        verts = dd.read_csv(self._vertex_file_paths)
        # Get the vertex dtypes:
        vertex_dtypes = {column: get_opencypher_dtype(verts[column].dtype) for column in verts.columns}

        # First rename the id column to :ID, add the :LABEL column, and
        # convert the dtypes to openCypher dtypes
        # verts = verts.rename(columns={self._vertex_file_id_column: ":ID"})
        # Copy the column instead
        verts[":ID"] = verts[self._vertex_file_id_column]
        verts[":LABEL"] = self._vertex_type
        # For all other columns, replace Name with Name:Dtype
        for column in verts.columns:
            # If there's a colon in the column, replace it with an underscore
            if ":" in column and column not in [":ID", ":LABEL"]:
                if "Unnamed:" in column:
                    verts = verts.drop(columns=[column])
                    continue
                else:
                    verts = verts.rename(columns={column: column.replace(":", "_")})
                    column = column.replace(":", "_")
            if column not in [":ID", ":LABEL"]:
                verts = verts.rename(columns={column: f"{column}:{vertex_dtypes[column]}"})
        return verts, vertex_dtypes

    def _get_edge_df(self):
        edges = dd.read_csv(self._edge_file_paths, header=0)
        return edges

    def to_opencypher(self, out_directory: str | pathlib.Path = "opencypher"):
        """
        Convert the CSV files to openCypher-compatible files.

        Because the inputs may be very large or the conversion process may be
        computationally intensive, the conversion process can be parallelized
        by specifying the number of workers to use. If workers is set to 1,
        the conversion will be performed in a single thread. If workers is set
        to a number greater than 1, the conversion will be performed in
        multiple threads. If workers is set to -1, the conversion will be
        performed in a number of threads equal to the number of cores on the
        current machine.

        Reference:
        https://docs.aws.amazon.com/neptune/latest/userguide/bulk-load-tutorial-format-opencypher.html
        """
        """
        System column headers in node files
        :ID, :LABEL
        Multiple label values are allowed, separated by semicolons (;).

        """
        _out_directory = pathlib.Path(out_directory)
        if not _out_directory.exists():
            _out_directory.mkdir(parents=True)

        verts, vertex_dtypes = self._get_vertex_df()
        # vert_dtype_dict = {column: verts[column].dtype for column in verts.columns}
        edges = self._get_edge_df()

        # Get unique source and target IDs
        all_verts = edges[self._edge_file_source_column].append(edges[self._edge_file_target_column]).unique()
        # Get the set of verts NOT in verts[":ID"]
        verts_to_add = all_verts[~all_verts.isin(list(verts[":ID"]))]
        # Add the verts to the verts dataframe (concat)
        verts_to_add = verts_to_add.to_frame(name=self._vertex_file_id_column)
        verts_to_add[":ID"] = verts_to_add[self._vertex_file_id_column]
        verts_to_add[":LABEL"] = self._vertex_type
        verts_to_add = verts_to_add.rename(
            columns={
                self._vertex_file_id_column: f"{self._vertex_file_id_column}:{vertex_dtypes[self._vertex_file_id_column]}"
            }
        ).compute()

        # Add missing columns to verts_to_add
        for column in verts.columns:
            if column not in verts_to_add.columns:
                verts_to_add[column] = np.nan
        # Reorder the columns
        verts_to_add = verts_to_add[verts.columns]

        verts.to_csv(_out_directory / "vertex_file.csv", index=False)
        verts_to_add.to_csv(_out_directory / "vertex_file.csv" / "_from_edges.part", index=False)

        # Get the edge dtypes:
        edge_dtypes = {column: get_opencypher_dtype(edges[column].dtype) for column in edges.columns}

        # Now rename the source and target columns to :START_ID and :END_ID
        edges = edges.rename(
            columns={
                self._edge_file_source_column: ":START_ID",
                self._edge_file_target_column: ":END_ID",
            }
        )
        edges[":TYPE"] = self._edge_type
        # For all other columns, replace Name with Name:Dtype
        for column in edges.columns:
            # If there's a colon in the column, replace it with an underscore
            if ":" in column and column not in [":START_ID", ":END_ID", ":TYPE"]:
                if "Unnamed:" in column:
                    edges = edges.drop(columns=[column])
                    continue
                else:
                    edges = edges.rename(columns={column: column.replace(":", "_")})
                    column = column.replace(":", "_")
            if column not in [":START_ID", ":END_ID", ":TYPE"]:
                edges = edges.rename(columns={column: f"{column}:{edge_dtypes[column]}"})

        # Drop all but the :START_ID, :END_ID, and :TYPE columns
        if self._edge_drop_remaining:
            edges = edges[[":START_ID", ":END_ID", ":TYPE"]]
        edges.repartition(npartitions=16).to_csv(_out_directory / "edge_file.csv", index=False)

    def to_networkx(self):
        """
        Convert the CSV files to a networkx-compatible in-memory store.

        """
        vertices = self._get_vertex_df()
        edges = self._get_edge_df()

        g = nx.from_pandas_edgelist(
            edges,
            source=self._edge_file_source_column,
            target=self._edge_file_target_column,
            create_using=nx.DiGraph(),
        )
        # Add the vertices with their attributes
        for vertex in vertices:
            g.add_node(vertex[self._vertex_file_id_column], **vertex.to_dict())

        return g

class OpenCypherHostProvider: