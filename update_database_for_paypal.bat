@echo off
echo Running PayPal integration database updates...

REM Prompt for Supabase project reference and database password
set /p SUPABASE_URL="Enter your Supabase project URL (e.g., db.project-ref.supabase.co): "
set /p SUPABASE_DB_PASSWORD="Enter your Supabase database password: "

REM Run the SQL script
echo Running PayPal integration SQL script...
psql -h %SUPABASE_URL% -U postgres -d postgres -p 5432 -W -f database/paypal_integration.sql

echo Database update complete!
pause 