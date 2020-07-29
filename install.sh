#! /bin/sh
if [ ! -f "./src/config.json" ]; then
  cp ./src/config.example.json ./src/config.json
fi
npm i --only=prod --no-audit --no-progress
exit 0
