@echo off
title vk-autocomment
IF NOT EXIST ./config.json (RENAME "./config.example.json" "config.json")
node src/index.js
echo Bot was forced to exit . . .
pause
