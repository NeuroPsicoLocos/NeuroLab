# Neurolab

Interactive neuroscience simulations for education, research, and scientific visualization.

## Apps

### NeuroCell Explorer

`apps/neurocell-explorer/`

Three-dimensional educational atlas for exploring nervous system cell types. The current version includes:

- cortical pyramidal neuron reconstructed from a real NeuroMorpho.Org SWC file;
- cortical Martinotti SOM+ interneuron reconstructed from a real NeuroMorpho.Org SWC file;
- astrocyte and microglia educational models;
- anatomy, connectivity, function, and clinical teaching panels;
- student and teacher modes;
- NeuroMorpho.Org provenance panel with neuron ID, source archive, region, DOI, and SWC statistics.

Open locally with:

```bash
python3 -m http.server 8005
```

Then visit:

```text
http://127.0.0.1:8005/apps/neurocell-explorer/
```

## Repository Structure

```text
Neurolab/
├── README.md
├── apps/
│   └── neurocell-explorer/
│       ├── index.html
│       ├── styles/
│       ├── src/
│       ├── assets/
│       └── data/
└── docs/
    └── neurocell-explorer/
        └── NEUROMORPHO_INTEGRATION.md
```

## Data Provenance

NeuroCell Explorer includes selected morphology files from NeuroMorpho.Org under:

```text
apps/neurocell-explorer/data/neuromorpho/
```

The local manifest tracks source URLs, NeuroMorpho.Org IDs, archive names, DOI references, and parser statistics.

Important distinction:

- SWC skeletons and local radii are real morphology data from NeuroMorpho.Org.
- Rendered membranes, smoothing, spines, boutons, and activity markers are educational visual interpolations.

See:

```text
docs/neurocell-explorer/NEUROMORPHO_INTEGRATION.md
```

## GitHub Pages

This repository is compatible with GitHub Pages as a static site.

Recommended URL after publishing:

```text
https://hromo-parra.github.io/Neurolab/apps/neurocell-explorer/
```

If GitHub Pages is configured from the `main` branch root, the repository root also includes an `index.html` redirector, so this URL should open NeuroCell Explorer as well:

```text
https://hromo-parra.github.io/Neurolab/
```
