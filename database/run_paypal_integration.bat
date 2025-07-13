@echo off
echo Running PayPal Integration SQL script...
echo.

REM Check if psql is installed
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: PostgreSQL client (psql) not found in PATH.
    echo Please install PostgreSQL or add its bin directory to your PATH.
    exit /b 1
)

REM Get database connection details
set /p DB_HOST=Enter database host (default: localhost): 
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT=Enter database port (default: 5432): 
if "%DB_PORT%"=="" set DB_PORT=5432

set /p DB_NAME=Enter database name: 
if "%DB_NAME%"=="" (
    echo Database name is required.
    exit /b 1
)

set /p DB_USER=Enter database user: 
if "%DB_USER%"=="" (
    echo Database user is required.
    exit /b 1
)

set /p DB_PASSWORD=Enter database password: 

REM Run the SQL script
echo Running PayPal integration script...
echo.

set PGPASSWORD=%DB_PASSWORD%
psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -f paypal_integration.sql

if %errorlevel% neq 0 (
    echo Error: Failed to run SQL script.
    exit /b 1
)

echo.
echo PayPal integration script completed successfully!
echo.
pause 