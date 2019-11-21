#! /bin/sh
if [ ! -f "./config.json" ]; then
  cp ./config.example.json ./config.json
fi
node src/index.js
exit 0
