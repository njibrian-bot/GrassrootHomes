@echo off
set /p msg=Commit message:
git add .
git commit -m "%msg%"
git push
echo.
echo Done! Site will update at https://njibrian-bot.github.io/GrassrootHomes/
pause
