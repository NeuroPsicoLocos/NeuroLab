#!/usr/bin/env python3
"""Abre el atlas por HTTP local sin instalar paquetes ni cambiar su contenido."""
import argparse
from functools import partial
import http.client
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import webbrowser

ATLAS_ROOT = Path(__file__).resolve().parents[1]
# En Simu-LAB se sirve la raíz común para que también funcione el enlace de retorno.
IN_PORTAL = ATLAS_ROOT.parent.name == "apps" and (ATLAS_ROOT.parents[1] / "index.html").is_file()
ROOT = ATLAS_ROOT.parents[1] if IN_PORTAL else ATLAS_ROOT
BASE_PATH = "/apps/medula-atlas/" if IN_PORTAL else "/"
MARKER = {"app": "medula-atlas", "launcherVersion": 1}


def is_atlas_running(port):
    """Reutiliza solo un servidor que se identifica como este atlas."""
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=0.5)
    try:
        connection.request("GET", BASE_PATH + "atlas-health.json")
        response = connection.getresponse()
        return response.status == 200 and json.loads(response.read(2048)) == MARKER
    except (OSError, ValueError, http.client.HTTPException):
        return False
    finally:
        connection.close()


def main():
    parser = argparse.ArgumentParser(description="Abrir Médula · Atlas interactivo")
    parser.add_argument("--no-browser", action="store_true", help="Iniciar sin abrir una ventana del navegador")
    options = parser.parse_args()
    handler = partial(SimpleHTTPRequestHandler, directory=str(ROOT))
    server = None
    # Primero busca una instancia existente, incluso si usa un puerto alternativo.
    port = next((candidate for candidate in range(8024, 8035) if is_atlas_running(candidate)), None)
    if port is None:
        for candidate in range(8024, 8035):
            try:
                server = ThreadingHTTPServer(("127.0.0.1", candidate), handler)
                server.daemon_threads = True
                port = candidate
                break
            except OSError:
                continue
    if port is None:
        print("No se pudo iniciar el atlas. Los puertos locales 8024 a 8034 están ocupados o no disponibles.")
        return 1

    url = f"http://127.0.0.1:{port}{BASE_PATH}#explore"
    print(f"Atlas disponible en {url}", flush=True)
    if not options.no_browser and not webbrowser.open(url, new=2):
        print("Abre esa dirección en tu navegador.", flush=True)
    if server is None:
        print("Se reutilizó el atlas que ya estaba abierto.")
        return 0
    print("Deja esta ventana abierta mientras usas el atlas. Pulsa Control + C para detenerlo.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nAtlas detenido.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
