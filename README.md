<h1 align=center>
<img src='https://github.com/aplbrain/motifstudio-server/assets/693511/30a42349-c794-4a32-88c5-c96cae449936' alt="Motif Studio" width=600 />
</h1>
<p align=center>Motif Studio is a browser-based tool for querying connectomes with the <a href="https://github.com/aplbrain/dotmotif">DotMotif</a> motif query language.</p>

> **Note**: Motif Studio is compatible with Python 3.10 or later.

## Installation and Setup

This repository holds dependencies and dev-dependencies in `requirements/`. To install dependencies, run:

```bash
pip install -r requirements/requirements.in
```

To install dev-dependencies, run:

```bash
pip install -r requirements/dev-requirements.in
```

## Configuring the Server

The server is configured using a `config.json` file in `src/server`. An example configuration file is provided in `src/server/config.example.json`.

## Running the Server

To run the server in "development" mode, run:

```bash
uvicorn src.server:app --reload
```

To run the server in "production" mode, run:

```bash
uvicorn src.server:app
```

## Running the Tests

To run the tests in "development" watch mode, run:

```bash
ptw
```

This will run the test suite and then wait for changes to the codebase. When changes are detected, the test suite will be run again.

To run the tests once, run:

```bash
pytest
```
