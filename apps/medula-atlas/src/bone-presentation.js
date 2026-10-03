/** Alterna una lámina detallada y el modelo giratorio sin perder la selección. */
export function setupBonePresentation() {
  const buttons = document.querySelectorAll('[data-bone-presentation]');
  function show(mode) {
    const model = mode === 'model';
    document.querySelector('#bone-illustration').hidden = model;
    document.querySelectorAll('[data-model-only]').forEach(element => { element.hidden = !model; });
    document.querySelector('#bone-view-kind').textContent = model ? '3D' : 'Lámina';
    buttons.forEach(button => {
      const selected = button.dataset.bonePresentation === mode;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', selected);
    });
  }
  buttons.forEach(button => button.addEventListener('click', () => show(button.dataset.bonePresentation)));
  show('illustration');
}
