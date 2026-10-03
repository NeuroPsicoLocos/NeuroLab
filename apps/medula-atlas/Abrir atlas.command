#!/bin/zsh
# Acceso macOS: funciona aunque la carpeta tenga espacios o se haya movido.
set -eu
ATLAS_DIR="${0:A:h}"
if ! command -v python3 >/dev/null 2>&1; then
  print 'No se encontró Python 3. Abre README.md para consultar cómo iniciar el atlas.'
  read -r '?Pulsa Enter para cerrar.'
  exit 1
fi
exec python3 "$ATLAS_DIR/scripts/open_atlas.py"
