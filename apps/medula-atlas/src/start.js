/** Arranque clásico: también puede mostrar ayuda al abrir index.html como archivo. */
(() => {
  const notice = document.querySelector('#startup-notice');
  function showNotice() {
    notice.hidden = false;
    document.querySelector('main').hidden = true;
    document.querySelector('.topbar').hidden = true;
    document.querySelector('.skip-link').hidden = true;
  }
  if (location.protocol === 'file:') {
    showNotice();
    return;
  }

  // Los módulos se cargan únicamente por HTTP(S), tanto en local como en Pages.
  const application = document.createElement('script');
  application.type = 'module';
  application.src = new URL('./src/app.js?v=12', document.baseURI).href;
  application.addEventListener('error', () => {
    document.querySelector('#startup-title').textContent = 'No se pudo cargar el atlas.';
    document.querySelector('#startup-message').textContent = 'Recarga la página. Si el problema continúa, comprueba que la carpeta del atlas esté completa y vuelve a abrirla desde su acceso local.';
    showNotice();
  });
  document.head.append(application);
})();
