@echo off
echo Deploying Unavailable Dates Feature...
echo.

echo 1. Deploying Edge Functions...
echo.

echo Deploying add-unavailable-dates function...
supabase functions deploy add-unavailable-dates --project-ref zukppjeasbcwosgqylce

echo Deploying remove-unavailable-dates function...
supabase functions deploy remove-unavailable-dates --project-ref zukppjeasbcwosgqylce

echo Deploying get-unavailable-dates function...
supabase functions deploy get-unavailable-dates --project-ref zukppjeasbcwosgqylce

echo.
echo 2. Setting up database table...
echo.

echo Running unavailable_dates_setup.sql...
supabase db push --project-ref zukppjeasbcwosgqylce

echo.
echo 3. Feature deployment complete!
echo.
echo The unavailable dates feature is now ready to use.
echo - Edge functions are deployed
echo - Database table is created
echo - RLS policies are configured
echo.
pause 