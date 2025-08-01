#!/bin/sh

while true; do
  if [[ -f "package.json" && -d "src" ]]; then

    echo "Running frontend container..."
    npm i
    npx tailwindcss -i src/style.css -o public/style.css
    npm run start

  else
    echo "Waiting file package.json and src folder..."
    sleep 1
  fi
done