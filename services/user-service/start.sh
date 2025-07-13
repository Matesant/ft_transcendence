#!/bin/bash

while true; do
  if [[ -f "package.json" && -d "src" ]]; then
    npm i
    npx nodemon src/index.js
    break
  else
    echo "Aguardando arquivo package.json e pasta src..."
    sleep 1
  fi
done