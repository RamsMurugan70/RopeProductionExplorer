@echo off
title PPC Reports - keep this window open
cd /d "%~dp0"
node tools\seed.js
start "" http://localhost:8088/
node server\server.js
pause
