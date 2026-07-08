# NeuroLab Project Organization Audit

Date: 2026-07-08

Production repository: `NeuroPsicoLocos/NeuroLab`

Production site:

- `https://neurolab.neuropsicolocos.com/`
- `https://neurolab.neuropsicolocos.com/apps/neurocell-explorer/`

## Scope

This audit reviews the current NeuroLab repository before Phase 3. It does not add new scientific modules, cognitive theory content, Attention Lab, or simulator rewrites.

Phase 3 should stabilize the existing NeuroCell Explorer 3D simulation by separating rendering, labels, camera controls, loading/error states, responsive layout, UI controls, and scientific data/config.

## Current Structure

```text
NeuroLab/
├── .gitattributes
├── .gitignore
├── .nojekyll
├── CNAME
├── LICENSE
├── README.md
├── index.html
├── apps/
│   └── neurocell-explorer/
│       ├── README.md
│       ├── index.html
│       ├── assets/
│       │   ├── neuropsicolocos-logo.png
│       │   └── atlas/
│       ├── data/
│       │   └── neuromorpho/
│       ├── docs/
│       │   └── NEUROMORPHO_INTEGRATION.md
│       ├── src/
│       │   ├── app.js
│       │   ├── cellFactory.js
│       │   ├── cellTypes.js
│       │   ├── swcParser.js
│       │   └── swcSamples.js
│       └── styles/
│           └── main.css
└── docs/
    └── neurocell-explorer/
        ├── NEUROMORPHO_INTEGRATION.md
        └── PROJECT_ORGANIZATION_AUDIT.md
```

## File Ownership

### Home Portal

- `index.html`: root redirect/portal for `/`.
- `README.md`: repository-level overview and deployment notes.
- `CNAME`: custom domain for GitHub Pages.

### NeuroCell Explorer App

- `apps/neurocell-explorer/index.html`: app shell, side panel controls, student/teacher mode UI, disclosure.
- `apps/neurocell-explorer/README.md`: app-specific technical and scientific notes.

### 3D Rendering

- `apps/neurocell-explorer/src/cellFactory.js`: procedural meshes, SWC rendering, organic soma/branches/spines, microglia states, labels anchors, activity meshes.
- `apps/neurocell-explorer/src/swcParser.js`: SWC parsing and section extraction.
- `apps/neurocell-explorer/src/swcSamples.js`: local SWC sample exports.

### UI Controls And App State

- `apps/neurocell-explorer/src/app.js`: Three.js scene setup, camera/orbit controls, app state, UI event binding, mode switching, labels, provenance panel, functional controls, quiz.
- `apps/neurocell-explorer/styles/main.css`: full app layout, scene panel, control panel, cards, buttons, responsive rules, disclosure styling.

### Data, Config, And Assets

- `apps/neurocell-explorer/src/cellTypes.js`: cell metadata, procedural presets, scientific content, atlas references, provenance-linked configuration, quiz content.
- `apps/neurocell-explorer/data/neuromorpho/manifest.json`: local NeuroMorpho provenance manifest.
- `apps/neurocell-explorer/data/neuromorpho/swc/`: local SWC morphologies.
- `apps/neurocell-explorer/data/neuromorpho/metadata/`: official metadata snapshots.
- `apps/neurocell-explorer/assets/neuropsicolocos-logo.png`: institutional logo.
- `apps/neurocell-explorer/assets/atlas/`: atlas/reference images used by the current app.

### Deployment

- `.nojekyll`: prevents GitHub Pages/Jekyll processing.
- `CNAME`: maps GitHub Pages to `neurolab.neuropsicolocos.com`.
- `index.html`: preserves `/` by redirecting to `apps/neurocell-explorer/`.
- `.gitattributes`, `.gitignore`, `LICENSE`: repository hygiene.

## Problems Found

1. `app.js` is doing too much.
   It owns scene initialization, app state, DOM events, camera framing, labels, provenance UI, mode switching, functional controls, quiz mounting, and the render loop.

2. `cellFactory.js` is doing too much.
   It owns cell generation, SWC mesh creation, procedural morphology, materials, activity meshes, microglia states, editable branches, and label anchors.

3. `cellTypes.js` mixes configuration and content.
   It contains render colors, morphology presets, scientific copy, atlas references, provenance-linked configuration, and quiz content.

4. NeuroMorpho integration documentation is duplicated.
   The same `NEUROMORPHO_INTEGRATION.md` exists in `docs/neurocell-explorer/` and `apps/neurocell-explorer/docs/`.

5. App README still contains legacy path language.
   It references `neurocell-lab-3d/` and `http://localhost:8000/neurocell-lab-3d/`, which can confuse deployment and local testing now that the official route is `apps/neurocell-explorer/`.

6. Root README still mentions old GitHub Pages URLs.
   The official repository is now `NeuroPsicoLocos/NeuroLab`, and production is `https://neurolab.neuropsicolocos.com`.

7. There are duplicate atlas image formats.
   Pyramidal and interneuron atlas images exist as both `.jpg` and `.png`. This may be intentional for quality/reference, but only referenced assets should remain long-term.

8. `apps/neurocell-explorer/assets/.DS_Store` is present.
   It is already ignored by `.gitignore` and should be removed in a cleanup commit.

9. The old local `neurocell-lab-3d` folder appears to be an earlier working copy.
   It contains older app files and local image/screen-recording artifacts. The current official app already includes production assets not present there, including Purkinje data, logo, CNAME deployment, and latest microglia work.

10. No local copy of `Hromo-parra/Neuropsicolocos_LAB` was found during this audit.
    Because it was not available locally and should not be imported unless clearly useful, nothing from that repo was merged.

## Dark Microglia Route Check

The official `neurolab/` folder contains the `Dark` microglia state in:

- `apps/neurocell-explorer/index.html`
- `apps/neurocell-explorer/src/app.js`
- `apps/neurocell-explorer/src/cellFactory.js`
- `apps/neurocell-explorer/src/cellTypes.js`

The older local `neurocell-lab-3d/` folder does not contain `Dark`.

The production URL also returns source files containing `microgliaDark`, so if the button does not appear in the browser, the likely causes are browser cache, an old local server process, or serving from the old `neurocell-lab-3d/` folder.

## Recommended Structure For Phase 3

Do not move files immediately in production without a focused PR. The following target structure is recommended:

```text
apps/neurocell-explorer/
├── index.html
├── README.md
├── assets/
│   ├── logo/
│   └── atlas/
├── data/
│   ├── cell-content/
│   └── neuromorpho/
├── docs/
├── src/
│   ├── app.js
│   ├── config/
│   │   ├── cellTypes.js
│   │   ├── quiz.js
│   │   └── scienceContent.js
│   ├── data/
│   │   ├── neuromorphoManifest.js
│   │   └── swcSamples.js
│   ├── rendering/
│   │   ├── viewer3d.js
│   │   ├── cameraController.js
│   │   ├── materials.js
│   │   ├── labels3d.js
│   │   ├── activityVisuals.js
│   │   └── cellFactory.js
│   ├── morphology/
│   │   ├── swcParser.js
│   │   ├── swcRenderer.js
│   │   ├── proceduralCells.js
│   │   └── microgliaStates.js
│   └── ui/
│       ├── controls.js
│       ├── contentPanel.js
│       ├── provenancePanel.js
│       ├── quizPanel.js
│       └── loadingState.js
└── styles/
    ├── main.css
    ├── layout.css
    ├── controls.css
    └── scene.css
```

## Safe Next Steps

1. Create a Phase 3 branch before moving code.
2. Preserve both public routes: `/` and `/apps/neurocell-explorer/`.
3. Add route smoke checks for root and app URLs.
4. Split `app.js` first into UI and viewer modules without changing behavior.
5. Split `cellFactory.js` second into rendering utilities and morphology-specific generators.
6. Move quiz/science copy out of `cellTypes.js` after behavior is stable.
7. Keep NeuroMorpho file paths unchanged until the loader is isolated.
8. Choose a single source of truth for `NEUROMORPHO_INTEGRATION.md`.
9. Remove unused duplicate atlas formats only after confirming which files are referenced.
10. Do not add Attention Lab, cognitive theory content, or new scientific modules until NeuroCell Explorer is stable.

## Phase 3 Acceptance Criteria

- `/` loads or redirects correctly.
- `/apps/neurocell-explorer/` loads correctly.
- No browser console errors on first load.
- Existing cell types still render: pyramidal, Martinotti SOM+, Purkinje, astrocyte, and microglia states.
- Labels remain synchronized with camera movement.
- Camera reset works consistently across cell types.
- Loading and error states are visible and non-blocking.
- Scientific provenance remains visible for SWC-based cells.
- README and docs describe the current production repository, not legacy folder names.
