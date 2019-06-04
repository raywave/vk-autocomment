#! /bin/sh
if [ ! -f "./config.json" ]; then
  cp ./config.example.json ./config.json
fi
npm i --only=prod --no-audit --no-progress
exit 0
