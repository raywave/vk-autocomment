@echo off
title vk-autocomment
IF NOT EXIST ./config.json (RENAME "./config.example.json" "config.json")
npm i --only=prod --no-audit --no-progress
echo Install successful.
pause
