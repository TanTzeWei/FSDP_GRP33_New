# Adding Sample Table Data to Supabase

The table reservation feature is now fully implemented and the API is working! The backend is returning a 200 status with an empty array `[]` when there are no tables, which is correct behavior.

To see the feature in action with actual tables, you need to add sample table data to your Supabase `hawker_seats` table.

## Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Paste the following SQL:

```sql
-- Insert sample tables for Hawker Centre ID 1
INSERT INTO hawker_seats (hawker_centre_id, table_code, capacity, zone, is_shared, status, notes)
VALUES
  (1, 'A1', 4, 'North Wing', FALSE, 'Available', 'Standard dining table'),
  (1, 'A2', 4, 'North Wing', FALSE, 'Available', 'Standard dining table'),
  (1, 'A3', 2, 'North Wing', FALSE, 'Available', 'Counter table'),
  (1, 'B1', 8, 'Central', TRUE, 'Available', 'Shared long table'),
  (1, 'B2', 8, 'Central', TRUE, 'Reserved', 'Shared long table'),
  (1, 'C1', 6, 'South Wing', FALSE, 'Available', 'Large family table'),
  (1, 'C2', 4, 'South Wing', FALSE, 'Available', 'Standard dining table'),
  (1, 'C3', 2, 'South Wing', FALSE, 'Available', 'Counter table'),
  (1, 'D1', 4, 'Near Fan', FALSE, 'Available', 'Air-conditioned section');
```

5. Click **Run** or press `Ctrl + Enter`

## Option 2: Using Supabase Dashboard UI

1. Go to your Supabase project
2. Navigate to **Table Editor**
3. Select the `hawker_seats` table
4. Click **Insert** and manually add rows with the following data:

| hawker_centre_id | table_code | capacity | zone | is_shared | status | notes |
|---|---|---|---|---|---|---|
| 1 | A1 | 4 | North Wing | false | Available | Standard dining table |
| 1 | A2 | 4 | North Wing | false | Available | Standard dining table |
| 1 | A3 | 2 | North Wing | false | Available | Counter table |
| 1 | B1 | 8 | Central | true | Available | Shared long table |
| 1 | B2 | 8 | Central | true | Reserved | Shared long table |
| 1 | C1 | 6 | South Wing | false | Available | Large family table |
| 1 | C2 | 4 | South Wing | false | Available | Standard dining table |
| 1 | C3 | 2 | South Wing | false | Available | Counter table |
| 1 | D1 | 4 | Near Fan | false | Available | Air-conditioned section |

## Testing After Adding Data

1. Open your application in the browser
2. Navigate to a hawker centre detail page
3. Click the **"Reserve a Table"** button at the bottom
4. You should now see a grid of tables with their information
5. Click on any table to see available reservation slots

## API Endpoints

The following endpoints are now available:

- **GET** `/api/hawker-centres/:hawkerCentreId/tables` - Get all tables for a hawker centre
- **GET** `/api/tables/:tableId/reservations?date=YYYY-MM-DD` - Get reservations for a table on a specific date
- **GET** `/api/tables/available-slots?tableId=X&date=YYYY-MM-DD` - Get available time slots
- **POST** `/api/reservations` - Create a new reservation (requires authentication)
- **GET** `/api/reservations` - Get user's reservations (requires authentication)
- **DELETE** `/api/reservations/:reservationId` - Cancel a reservation (requires authentication)

## Troubleshooting

**Issue**: Still seeing empty table list after adding data
- **Solution**: Make sure you're inserting into a hawker centre that exists. Check your hawker_centre_id matches an actual centre in your database.

**Issue**: Getting a 500 error
- **Solution**: Check the backend server logs for specific error messages. The issue has been fixed (incorrect Supabase import), so if you see errors, restart the backend with `node app.js`.

**Issue**: Tables show but can't make a reservation
- **Solution**: Make sure you're logged in. The POST endpoint requires authentication. Check your browser's developer console for detailed error messages.

## Next Steps

1. Add sample tables for other hawker centres by changing the `hawker_centre_id` value
2. Create reservations to test the full workflow
3. Test the reservation confirmation and cancellation features

---

For more information on the table reservation feature, see [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md) and [DATABASE_INTEGRATION_GUIDE.md](DATABASE_INTEGRATION_GUIDE.md).
