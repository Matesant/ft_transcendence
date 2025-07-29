#!/bin/bash

while true; do
  if [[ -f "package.json" && -d "src" ]]; then
    npm i
    npm run build
    npx tailwindcss -i src/style.css -o public/style.css
    exec nginx -g "daemon off;"
    break
  else
    echo "Aguardando arquivo package.json e pasta src..."
    sleep 1
  fi
done