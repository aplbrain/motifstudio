<h1 align=center>
<img src='https://github.com/aplbrain/motifstudio-server/assets/693511/30a42349-c794-4a32-88c5-c96cae449936' alt="Motif Studio" width=600 />
</h1>
<p align=center>Motif Studio is a browser-based tool for querying connectomes with the <a href="https://github.com/aplbrain/dotmotif">DotMotif</a> motif query language.</p>

![image](https://github.com/aplbrain/motifstudio-web/assets/693511/d6223400-6089-4da9-892c-0e12ae83ff9f)

---

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

You can optionally configure resource limits for queries to prevent long-running or memory-intensive queries from impacting server stability. Add a `query_limits` section with the following fields:

```json
"query_limits": {
  "max_ram_pct": 0.5,
  "max_ram_bytes": 1073741824,
  "max_duration_seconds": 120
}
```

`max_ram_pct` is a fraction of total system memory (default: 0.5), `max_ram_bytes` is an absolute memory limit in bytes (optional; if set, overrides `max_ram_pct`), and `max_duration_seconds` is the maximum wall-clock time in seconds for a query (default: 120).

Note: On non-Linux/Darwin systems, install `psutil` to enable memory limit detection.

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

## Running the web application


This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


---

## Citation

If this work is useful to your research, please cite the following paper:

[Scalable graph analysis tools for the connectomics community](https://www.biorxiv.org/content/10.1101/2022.06.01.494307v1.abstract)
Matelsky et al., 2022

```bibtex
@article{matelsky2022scalable,
  title={Scalable graph analysis tools for the connectomics community},
  author={Matelsky, Jordan K and Johnson, Erik C and Wester, Brock and Gray-Roncal, William},
  journal={bioRxiv},
  pages={2022--06},
  year={2022},
  publisher={Cold Spring Harbor Laboratory}
}
```
