#!/bin/sh

while true; do
  if [[ -f "package.json" && -d "src" ]]; then

    if [[ -n "$DEV" ]]; then
      echo "Running in development mode..."
      npm i
      npm run start
    fi
    if ! grep -qs bundle.js public/index.html; then
      echo "Running in production mode..."
      npm i
      npm run build
      npx tailwindcss -i src/style.css -o public/style.css
    fi
    exec nginx -g "daemon off;"
  else
    echo "Waiting file package.json and src folder..."
    sleep 1
  fi
done