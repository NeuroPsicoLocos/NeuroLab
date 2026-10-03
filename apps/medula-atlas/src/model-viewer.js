/** Amplía el mismo visor WebGL. El diálogo nativo gestiona foco y tecla Escape. */
export function setupModelViewer() {
  const dialog = document.querySelector('#model-dialog');
  const content = document.querySelector('#spine-model-content');
  const slot = document.querySelector('#spine-model-slot');
  const button = document.querySelector('#expand-model');
  button.addEventListener('click', () => {
    document.querySelector('#model-dialog-host').append(content);
    dialog.showModal();
  });
  document.querySelector('#close-model').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    slot.append(content);
    button.focus();
  });
}
