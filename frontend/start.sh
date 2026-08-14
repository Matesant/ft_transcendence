#!/bin/sh
set -e

while [ ! -f "package.json" ] || [ ! -d "src" ]; do
  echo "Waiting file package.json and src folder..."
  sleep 1
done

# --include=dev é obrigatório: com NODE_ENV=production o npm omite (e poda) as
# devDependencies, e webpack/ts-loader/@babylonjs/core vivem todas lá.
echo "Installing dependencies..."
npm i --include=dev

echo "Building CSS..."
npx tailwindcss -i src/style.css -o public/style.css

# Build de produção: bundle minificado e sem source map inline (o inline embutia
# todo o fonte, deixando o bundle na casa dos 15 MB).
echo "Building bundle..."
NODE_ENV=production npm run build

echo "Starting nginx..."
exec nginx -g 'daemon off;'
