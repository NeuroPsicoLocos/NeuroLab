# NeuroLab

Interactive neuroscience simulations for education, research, and scientific visualization.

Production site:

```text
https://neurolab.neuropsicolocos.com/
https://neurolab.neuropsicolocos.com/apps/neurocell-explorer/
```

Official repository:

```text
https://github.com/NeuroPsicoLocos/NeuroLab
```

## Apps

### NeuroCell Explorer

`apps/neurocell-explorer/`

Three-dimensional educational atlas for exploring nervous system cell types. The current version includes:

- cortical pyramidal neuron reconstructed from a real NeuroMorpho.Org SWC file;
- cortical Martinotti SOM+ interneuron reconstructed from a real NeuroMorpho.Org SWC file;
- cerebellar Purkinje cell reconstructed from a real NeuroMorpho.Org SWC file with dendrites and soma, no axon in the selected dataset;
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

## Roadmap Notes

- Myelin, nodes of Ranvier, and internodal geometry are pending for cell types where axonal reconstruction is available. Do not add myelin to SWC datasets that do not include a reconstructed axon.
- Phase 3 should stabilize the existing NeuroCell Explorer app before adding new modules. See `docs/neurocell-explorer/PROJECT_ORGANIZATION_AUDIT.md`.

## Disclosure

NeuroCell Explorer is an educational and scientific visualization resource developed by NeuroPsicoLocos. It does not replace clinical evaluation, medical diagnosis, or validated biophysical simulation.

When indicated, SWC reconstructions come from NeuroMorpho.Org. Rendered surfaces, materials, dendritic spines, synaptic markers, and activity effects are teaching-oriented visual interpolations.

Contact: admin@neuropsicolocos.com

See:

```text
docs/neurocell-explorer/NEUROMORPHO_INTEGRATION.md
```

## GitHub Pages

This repository is compatible with GitHub Pages as a static site.

Recommended URLs after publishing:

```text
https://neurolab.neuropsicolocos.com/apps/neurocell-explorer/
```

If GitHub Pages is configured from the `main` branch root, the repository root also includes an `index.html` redirector, so this URL should open NeuroCell Explorer as well:

```text
https://neurolab.neuropsicolocos.com/
```
