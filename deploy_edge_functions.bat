@echo off
echo Deploying Edge Functions to Supabase...

REM Deploy add-unavailable-dates function
echo Deploying add-unavailable-dates function...
supabase functions deploy add-unavailable-dates

REM Deploy remove-unavailable-dates function
echo Deploying remove-unavailable-dates function...
supabase functions deploy remove-unavailable-dates

REM Deploy get-unavailable-dates function
echo Deploying get-unavailable-dates function...
supabase functions deploy get-unavailable-dates

REM Deploy check-availability function
echo Deploying check-availability function...
supabase functions deploy check-availability

REM Deploy get-listing-details function
echo Deploying get-listing-details function...
supabase functions deploy get-listing-details

REM Deploy get-listings function
echo Deploying get-listings function...
supabase functions deploy get-listings

REM Deploy create-booking function
echo Deploying create-booking function...
supabase functions deploy create-booking

echo.
echo All edge functions deployed successfully!
echo.
echo Available functions:
echo - add-unavailable-dates
echo - remove-unavailable-dates
echo - get-unavailable-dates
echo - check-availability
echo - get-listing-details
echo - get-listings
echo - create-booking
echo.
pause 