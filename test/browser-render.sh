#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -m http.server 8123 --bind 127.0.0.1 >/tmp/composeme-http.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
sleep 1
CHROME="$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser || true)"
if [[ -z "$CHROME" ]]; then
  echo "No Chrome/Chromium available for real browser render test" >&2
  exit 1
fi
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage --virtual-time-budget=8000 \
  --dump-dom http://127.0.0.1:8123/test/browser-render.html > /tmp/composeme-render-dom.html
cat /tmp/composeme-render-dom.html
grep -q 'data-render-success="true"' /tmp/composeme-render-dom.html
grep -Eq 'data-note-count="[1-9][0-9]*"' /tmp/composeme-render-dom.html
grep -q 'data-violin-program-directive="true"' /tmp/composeme-render-dom.html
grep -q 'data-violin-program-midi="true"' /tmp/composeme-render-dom.html
grep -q 'data-range-warning="true"' /tmp/composeme-render-dom.html
grep -q 'data-abc-export="true"' /tmp/composeme-render-dom.html
grep -q 'data-midi-export="true"' /tmp/composeme-render-dom.html
grep -q 'data-musicxml-export="true"' /tmp/composeme-render-dom.html
grep -q 'data-svg-export="true"' /tmp/composeme-render-dom.html
grep -q 'data-print-export="true"' /tmp/composeme-render-dom.html

grep -q 'data-abendlicht-lines="4"' /tmp/composeme-render-dom.html
grep -q 'data-abendlicht-paired="true"' /tmp/composeme-render-dom.html

grep -q 'data-abendlicht-aligned="true"' /tmp/composeme-render-dom.html
