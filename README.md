# Neurolab

Interactive neuroscience simulations for education, research, and scientific visualization.

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

### Attention Lab

`apps/attention-lab/`

Interactive cognitive attention simulator for classroom and online teaching. Features:

- selectable theories: Broadbent, Treisman, Kahneman, Posner, and Stroop;
- cognitive load and Stroop-style interference sliders;
- real-time estimated attention index with visual progress bar.

Built with React 19 + Vite + TypeScript. Source lives in `apps/attention-lab/src/`; the compiled
output (`index.html` and `assets/`) is committed alongside the source so no build step is required
for deployment.

To develop locally:

```bash
cd apps/attention-lab/_project
npm install
npm run dev
```

To rebuild the production output after changing source files:

```bash
cd apps/attention-lab/_project
npm run build
```

Commit the updated `index.html` and `assets/` files after rebuilding.

## Repository Structure

```text
Neurolab/
├── README.md
├── index.html                        ← home portal (links to both apps)
├── apps/
│   ├── neurocell-explorer/           ← static vanilla JS app (no build step)
│   │   ├── index.html
│   │   ├── styles/
│   │   ├── src/
│   │   ├── assets/
│   │   └── data/
│   └── attention-lab/                ← React/Vite app (source + built output)
│       ├── index.html                ← built entry (committed)
│       ├── assets/                   ← hashed JS/CSS bundles (committed)
│       └── _project/                 ← Vite project source (build from here)
│           ├── index.html            ← Vite entry template
│           ├── src/                  ← TypeScript source
│           ├── package.json
│           ├── vite.config.ts
│           └── tsconfig*.json
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

## Disclosure

NeuroCell Explorer is an educational and scientific visualization resource developed by NeuroPsicoLocos. It does not replace clinical evaluation, medical diagnosis, or validated biophysical simulation.

When indicated, SWC reconstructions come from NeuroMorpho.Org. Rendered surfaces, materials, dendritic spines, synaptic markers, and activity effects are teaching-oriented visual interpolations.

Contact: admin@neuropsicolocos.com

See:

```text
docs/neurocell-explorer/NEUROMORPHO_INTEGRATION.md
```

## GitHub Pages

This repository is compatible with GitHub Pages as a static site (served from the `main` branch root).

All app routes after publishing:

```text
https://neurolab.neuropsicolocos.com/                       ← home portal
https://neurolab.neuropsicolocos.com/apps/neurocell-explorer/
https://neurolab.neuropsicolocos.com/apps/attention-lab/
```

The root `index.html` now serves as a home portal with cards linking to both apps (no redirect).
Attention Lab built assets use `base: '/apps/attention-lab/'` so all asset paths are correct under
the custom domain.
