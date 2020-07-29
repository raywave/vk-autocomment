#! /bin/sh
if [ ! -f "./src/config.json" ]; then
  cp ./src/config.example.json ./src/config.json
fi
node src/index.js
exit 0
