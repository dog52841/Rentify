# Rentify - Peer-to-Peer Rental Platform

Rentify is a modern peer-to-peer marketplace that allows users to rent or list items for rental, inspired by platforms like Airbnb. Built with React, TypeScript, Supabase, and Stripe integration.

![Rentify Screenshot](public/assets/logo.svg)

## Features

- **User Authentication**: Secure login/signup with Supabase Auth
- **Listings Marketplace**: Browse, search, and filter items available for rent
- **Geospatial Search**: Find nearby listings with optional PostGIS integration
- **Real-time Messaging**: Chat with item owners before booking
- **Secure Payments**: Process payments through Stripe Connect
- **User Dashboard**: Track listings, bookings, and earnings
- **Favorites & Reviews**: Save favorites and leave reviews after rentals
- **Responsive Design**: Beautiful UI that works on all devices

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, Shadcn UI
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Serverless Functions**: Supabase Edge Functions (Deno runtime)
- **Payments**: Stripe Connect for marketplace payments
- **Maps**: Leaflet for location visualization
- **Animation**: Framer Motion for smooth transitions

## Getting Started

### Prerequisites
- Node.js 16+
- Supabase account
- Stripe account for payments

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/rentify.git
   cd rentify
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   Create a `.env` file with your Supabase and Stripe credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   ```

4. Set up the database
   Follow the instructions in the [Database Setup Guide](database/README.md)

5. Start the development server
   ```
   npm run dev
   ```

## Database Configuration

The application uses Supabase PostgreSQL with optional PostGIS support for location-based features. See the [Database Setup Guide](database/README.md) for detailed instructions.

## Deployment

The application can be deployed to platforms like Vercel, Netlify, or any static hosting provider:

```
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
