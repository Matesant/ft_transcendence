#!/bin/bash

while true; do
  if [[ -f "package.json" && -d "src" ]]; then
    if ! grep -qs bundle.js public/index.html; then
      npm i
      npm run build
      npx tailwindcss -i src/style.css -o public/style.css
    fi
    exec nginx -g "daemon off;"
  else
    echo "Aguardando arquivo package.json e pasta src..."
    sleep 1
  fi
done