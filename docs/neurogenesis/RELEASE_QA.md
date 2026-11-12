# NeuroGénesis integration QA · 2026-11-12

## Scope
Imported published source v2, commit ac792b636ad928fba360f2eb035c8f9bf94c9d55, to an isolated clone based on NeuroLab 684acd2. Original Site and access settings unchanged. Only module, catalog card, eight ES/EN translation pairs, tests and this report are included. Preview configuration is not part of release.

## Automated checks
- Full Node suite: 177 passed, 0 failed.
- New module tests: 3 passed (catalog, local links/assets/unique IDs, references and local-only quiz storage).
- JavaScript syntax across apps/shared/scripts/tests passed.
- Ephys and PSP bundle checks passed; git diff whitespace check passed.

## Browser preview, Chrome desktop
- All three WebP images loaded at natural width; desktop width 1168 CSS px without horizontal overflow.
- Timeline range, teacher-mode toggle, neurulation controls, vesicle and cellular-process tabs operational.
- Quiz: empty submission stays on question, correct-answer feedback, progression through all 12, result and restart checked.
- Glossary search returns relevant definitions.
- Original scientific simplification notices and external references retained.
- Mobile hardware and external video playback not tested in this release. CSS responsive rules retained from source.

## Deployment acceptance
After publishing, verify the catalog, /apps/neurogenesis/, CSS, JS and three illustrations anonymously, and verify return navigation. Commit and CI/Pages results are reported separately after deployment; this pre-release record does not claim deployment success.
