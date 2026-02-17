@echo off
title Spring Boot Backend

echo ================================
echo Starting Spring Boot Backend...
echo ================================

REM Move to the directory where this bat file exists
cd /d %~dp0

REM Run Spring Boot using Gradle Wrapper
call gradlew bootRun

pause
