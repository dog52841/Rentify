@echo off
echo Running complete Rentify database schema setup...
echo.

REM Check if psql is available
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: psql is not installed or not in PATH
    echo Please install PostgreSQL and add psql to your PATH
    pause
    exit /b 1
)

REM Get database connection details
set /p DB_HOST="Enter database host (default: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="Enter database port (default: 5432): "
if "%DB_PORT%"=="" set DB_PORT=5432

set /p DB_NAME="Enter database name: "
if "%DB_NAME%"=="" (
    echo Error: Database name is required
    pause
    exit /b 1
)

set /p DB_USER="Enter database user: "
if "%DB_USER%"=="" (
    echo Error: Database user is required
    pause
    exit /b 1
)

set /p DB_PASSWORD="Enter database password: "
if "%DB_PASSWORD%"=="" (
    echo Error: Database password is required
    pause
    exit /b 1
)

echo.
echo Running complete schema setup...
echo.

REM Set PGPASSWORD environment variable
set PGPASSWORD=%DB_PASSWORD%

REM Run the complete schema script
psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -f database/complete_schema_with_unavailable_dates.sql

if %errorlevel% equ 0 (
    echo.
    echo ✅ Complete database schema setup completed successfully!
    echo.
    echo The following features are now available:
    echo - Unavailable dates management for listings
    echo - Comprehensive booking system with availability checking
    echo - User profiles and authentication
    echo - Reviews and ratings system
    echo - Messaging system
    echo - Wishlist functionality
    echo - Admin dashboard support
    echo - Payment integration support
    echo.
    echo Next steps:
    echo 1. Deploy the edge functions to Supabase
    echo 2. Test the application thoroughly
    echo 3. Add sample data if needed
    echo.
) else (
    echo.
    echo ❌ Error running database schema setup
    echo Please check the error messages above and try again
    echo.
)

REM Clear the password from environment
set PGPASSWORD=

pause 