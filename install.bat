@echo off
title vk-autocomment
IF NOT EXIST ./src/config.json (RENAME "./src/config.example.json" "config.json")
yarn add
echo Install successful.
pause
