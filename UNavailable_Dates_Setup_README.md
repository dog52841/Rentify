# Unavailable Dates Feature Setup

This document provides complete setup instructions for the "Unavailable on" feature that allows listing owners to block specific dates when their items are not available for rent.

## 🚀 Quick Setup

### 1. Database Setup

Run the SQL script to create the necessary database structure:

```bash
# Execute the SQL script in your Supabase SQL editor
# Copy and paste the contents of: database/unavailable_dates_setup.sql
```

### 2. Deploy Edge Functions

Run the deployment script:

```bash
# Windows
deploy_edge_functions.bat

# Or manually deploy each function:
supabase functions deploy add-unavailable-dates
supabase functions deploy remove-unavailable-dates
supabase functions deploy get-unavailable-dates
supabase functions deploy check-availability
supabase functions deploy get-listing-details
supabase functions deploy get-listings
supabase functions deploy create-booking
```

## 📋 Database Schema

### Tables Created

#### `unavailable_dates`
- `id` (UUID, Primary Key)
- `listing_id` (UUID, Foreign Key to listings)
- `unavailable_date` (DATE)
- `created_at` (TIMESTAMP)

### Functions Created

1. **`add_unavailable_dates(listing_id, dates[])`** - Add unavailable dates
2. **`remove_unavailable_dates(listing_id, dates[])`** - Remove unavailable dates
3. **`get_unavailable_dates(listing_id)`** - Get unavailable dates for a listing
4. **`check_availability(listing_id, start_date, end_date)`** - Check availability for a date range

## 🔧 Edge Functions

### Available Functions

| Function | Method | Purpose |
|----------|--------|---------|
| `add-unavailable-dates` | POST | Add unavailable dates to a listing |
| `remove-unavailable-dates` | POST | Remove unavailable dates from a listing |
| `get-unavailable-dates` | GET | Get unavailable dates for a listing |
| `check-availability` | POST | Check if dates are available for booking |
| `get-listing-details` | GET | Get detailed listing info with unavailable dates |
| `get-listings` | GET | Get listings with filtering and pagination |
| `create-booking` | POST | Create a booking with availability checking |

### Function Endpoints

All functions are available at:
```
https://your-project.supabase.co/functions/v1/{function-name}
```

## 🎯 Frontend Integration

### React Components

The feature includes a `UnavailableDatesPane` component that provides:
- Calendar interface for selecting dates
- Add/remove unavailable dates
- Visual feedback for selected dates
- Integration with listing management

### Usage in Pages

The feature is integrated into:
- **DashboardPage** - For listing owners to manage unavailable dates
- **ListingPage** - For displaying unavailable dates to potential renters
- **Browse/Home pages** - For filtering and displaying listings

## 🔒 Security Features

### Row Level Security (RLS)
- Users can view unavailable dates for any listing
- Only listing owners can add/remove unavailable dates
- Proper authentication required for all operations

### Authorization Checks
- All edge functions verify user authentication
- Listing ownership verification before modifications
- Input validation and sanitization

## 📱 API Usage Examples

### Add Unavailable Dates
```javascript
const response = await fetch('/functions/v1/add-unavailable-dates', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    listing_id: 'uuid',
    dates: ['2024-01-15', '2024-01-16', '2024-01-17']
  })
});
```

### Get Unavailable Dates
```javascript
const response = await fetch(`/functions/v1/get-unavailable-dates?listing_id=${listingId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Check Availability
```javascript
const response = await fetch('/functions/v1/check-availability', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    listing_id: 'uuid',
    start_date: '2024-01-15',
    end_date: '2024-01-17'
  })
});
```

## 🛠️ Troubleshooting

### Common Issues

1. **Function not found**
   - Ensure functions are deployed: `supabase functions deploy {function-name}`
   - Check function names match exactly

2. **Authentication errors**
   - Verify user is logged in
   - Check JWT token is valid
   - Ensure proper Authorization header

3. **Permission denied**
   - Verify user owns the listing
   - Check RLS policies are properly configured

4. **Database errors**
   - Ensure `unavailable_dates` table exists
   - Verify foreign key relationships
   - Check function permissions

### Debugging

1. **Check function logs**:
   ```bash
   supabase functions logs {function-name}
   ```

2. **Test database functions directly**:
   ```sql
   SELECT * FROM get_unavailable_dates('listing-uuid');
   ```

3. **Verify RLS policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'unavailable_dates';
   ```

## 🔄 Updates and Maintenance

### Adding New Features
1. Create new edge function in `supabase/functions/`
2. Add corresponding database functions if needed
3. Update frontend components
4. Deploy and test

### Monitoring
- Monitor function execution times
- Check for failed requests
- Review database performance
- Monitor RLS policy effectiveness

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review function logs
3. Verify database schema
4. Test with minimal examples

## 🎉 Success Checklist

- [ ] Database schema created successfully
- [ ] All edge functions deployed
- [ ] RLS policies configured
- [ ] Frontend components integrated
- [ ] Authentication working
- [ ] Date selection working
- [ ] Availability checking working
- [ ] Booking creation with availability validation
- [ ] Error handling implemented
- [ ] UI/UX polished and responsive

The unavailable dates feature is now fully integrated and ready for use! 🚀 