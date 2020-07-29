@echo off
title vk-autocomment
IF NOT EXIST ./src/config.json (RENAME "./src/config.example.json" "config.json")
node src/index.js
echo Bot was forced to exit . . .
pause
