# Rentify Database Setup Guide

This guide will help you set up the database for the Rentify application correctly.

## Prerequisites

- Supabase account and project
- Access to Supabase SQL Editor

## Setup Instructions

1.  **Navigate to the SQL Editor:**
    In your Supabase project dashboard, go to the "SQL Editor" section.

2.  **Execute the Schema Script:**
    Open the `database/final_schema.sql` file in your code editor, copy its entire contents, and paste it into a new query in the Supabase SQL Editor.

3.  **Run the Query:**
    Click the "Run" button. This single script will set up all necessary tables, functions, and security policies. It also automatically enables the required `postgis` and `uuid-ossp` extensions.

## Troubleshooting

-   **Permission Errors:** If you see an error like `permission denied to create extension "postgis"`, you might need to enable it manually via the Supabase Dashboard. Go to `Database` > `Extensions`, find `postgis`, and enable it. Then, run the SQL script again.
-   **Other Errors:** The script is designed to work on both new and existing setups by safely dropping old objects before creating new ones. If you continue to face issues, please let me know.

## Database Structure

The database includes:
- User profiles
- Listings with location data
- Bookings and payments
- Favorites and wishlists
- Messaging functionality
- Review system

All tables have Row Level Security (RLS) policies to control access. 