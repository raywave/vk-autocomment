@echo off
IF NOT EXIST ./config.json (RENAME "./config.example.json" "config.json")
title vk-autocomment
node index.js
echo Bot was forced to exit . . .
pause
