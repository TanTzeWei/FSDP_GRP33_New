# 🚀 Reservation Feature Setup Checklist

## Database Setup ✅

- [ ] **Update init-schema.sql** 
  - File: `init-schema.sql`
  - New tables: `table_inventory`, `reservations`, `reservation_items`
  - Run the migration on your Supabase database

## Backend Setup ✅

- [ ] **Verify ReservationModel**
  - File: `models/reservationModel.js`
  - Status: ✅ CREATED (342 lines)
  - 15 methods for all reservation operations

- [ ] **Verify ReservationController**
  - File: `controllers/reservationController.js`
  - Status: ✅ CREATED (353 lines)
  - All 12 endpoint handlers implemented

- [ ] **Verify app.js Configuration**
  - File: `app.js`
  - Status: ✅ MODIFIED
  - ReservationController imported
  - All routes registered with auth middleware

## Frontend Setup ✅

- [ ] **Add ReservationsPage Route**
  - File: `frontend/src/pages/ReservationsPage.jsx`
  - Status: ✅ CREATED
  - Add to your App.jsx router:
    ```jsx
    import ReservationsPage from './pages/ReservationsPage';
    <Route path="/reservations" element={<ReservationsPage />} />
    ```

- [ ] **Add Navigation Link**
  - File: `frontend/src/components/Header.jsx` (or your nav)
  - Status: MANUAL STEP
  - Add link to `/reservations`:
    ```jsx
    <Link to="/reservations">📅 Reservations</Link>
    ```

## Component Files ✅

Frontend Components:
- [ ] `frontend/src/components/Reservation.jsx` - ✅ CREATED (267 lines)
- [ ] `frontend/src/components/Reservation.css` - ✅ CREATED (118 lines)
- [ ] `frontend/src/components/ReservationHistory.jsx` - ✅ CREATED (207 lines)
- [ ] `frontend/src/components/ReservationHistory.css` - ✅ CREATED (178 lines)
- [ ] `frontend/src/pages/ReservationsPage.jsx` - ✅ CREATED (52 lines)
- [ ] `frontend/src/pages/ReservationsPage.css` - ✅ CREATED (98 lines)

## Documentation ✅

- [ ] `RESERVATION_FEATURE.md` - ✅ CREATED (Complete API reference)
- [ ] `INTEGRATION_GUIDE.md` - ✅ CREATED (Setup instructions)
- [ ] `IMPLEMENTATION_SUMMARY.md` - ✅ CREATED (Overview)
- [ ] `SETUP_CHECKLIST.md` - ✅ THIS FILE

## Testing Setup

### Test 1: Database Verification
- [ ] Connect to Supabase dashboard
- [ ] Verify `table_inventory` table exists
- [ ] Verify `reservations` table exists
- [ ] Verify `reservation_items` table exists

### Test 2: Backend Verification
```bash
# In your terminal, verify server starts without errors
npm start

# Check console for:
# ✅ ReservationController loaded
# ✅ Reservation routes configured
```

### Test 3: Sample Data Creation
```sql
-- Add sample tables for a hawker centre
INSERT INTO table_inventory (hawker_centre_id, table_number, seating_capacity, location_description) VALUES
(1, 1, 2, 'Near entrance'),
(1, 2, 2, 'Near entrance'),
(1, 3, 4, 'Main area'),
(1, 4, 4, 'Main area'),
(1, 5, 4, 'Corner booth'),
(1, 6, 6, 'Large table');
```

### Test 4: Frontend Verification
```bash
# In frontend directory
npm install  # if needed
npm run dev

# Navigate to http://localhost:5173/reservations
# You should see the Reservations page
```

### Test 5: Make Reservation Test
1. Login to the application
2. Navigate to `/reservations`
3. Click "Make a Reservation" tab
4. Fill in the form:
   - Hawker Centre ID: 1
   - Date: Pick a future date
   - Time: Pick a time (e.g., 18:30)
   - Table: Should show available tables
   - Party Size: 2-4
   - Click "Create Reservation"

### Test 6: View Reservations Test
1. Click "My Reservations" tab
2. Should see your created reservation
3. Try filtering by status
4. Try cancelling the reservation

## API Testing (Optional - Postman/curl)

### Get Available Tables
```bash
curl "http://localhost:3000/api/reservations/available-tables?hawkerCentreId=1&reservationDate=2026-02-15&reservationTime=18:30"
```

### Create Reservation (requires token)
```bash
curl -X POST "http://localhost:3000/api/reservations" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hawkerCentreId": 1,
    "tableId": 5,
    "tableNumber": 5,
    "reservationDate": "2026-02-15",
    "reservationTime": "18:30",
    "partySize": 4
  }'
```

### Get My Reservations
```bash
curl "http://localhost:3000/api/reservations" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Customization (Optional)

### Change Theme Color
Update all CSS files:
- `Reservation.css` - Line with `#FF9501`
- `ReservationHistory.css` - Line with `#FF9501`
- `ReservationsPage.css` - Line with `#FF9501`

Replace `#FF9501` with your color (e.g., `#007bff` for blue)

### Change Reservation Duration
In `Reservation.jsx`, find `fetchAvailableTables()`:
```jsx
duration: 120  // Change to your preferred duration (minutes)
```

### Adjust Minimum Days Ahead
In `Reservation.jsx`, find `getMinDate()`:
```jsx
tomorrow.setDate(tomorrow.getDate() + 1);  // Change 1 to desired days
```

## Deployment Checklist

Before going to production:

- [ ] Database migrations completed
- [ ] Backend routes registered and tested
- [ ] Frontend routes added to App.jsx
- [ ] Navigation links added to Header
- [ ] Sample table data created for each hawker centre
- [ ] Tested on multiple browsers (Chrome, Firefox, Safari)
- [ ] Tested on mobile devices
- [ ] Tested with various party sizes
- [ ] Tested cancellation workflow
- [ ] Verified authentication works
- [ ] Checked error handling
- [ ] Reviewed console for errors
- [ ] Set up error logging

## File Locations Reference

```
Backend:
├── models/
│   └── reservationModel.js ✅
├── controllers/
│   └── reservationController.js ✅
└── app.js (modified) ✅

Frontend:
├── src/components/
│   ├── Reservation.jsx ✅
│   ├── Reservation.css ✅
│   ├── ReservationHistory.jsx ✅
│   └── ReservationHistory.css ✅
└── src/pages/
    ├── ReservationsPage.jsx ✅
    └── ReservationsPage.css ✅

Database:
└── init-schema.sql (modified) ✅

Documentation:
├── RESERVATION_FEATURE.md ✅
├── INTEGRATION_GUIDE.md ✅
├── IMPLEMENTATION_SUMMARY.md ✅
└── SETUP_CHECKLIST.md (this file) ✅
```

## Troubleshooting

### Issue: 404 Not Found on /reservations
**Solution:**
- [ ] Check ReservationsPage route is added to App.jsx
- [ ] Verify correct file path in import
- [ ] Restart development server

### Issue: Components not rendering
**Solution:**
- [ ] Check browser console for errors
- [ ] Verify all CSS files are imported
- [ ] Ensure AuthContext is properly set up
- [ ] Check React version compatibility

### Issue: API returns 401 Unauthorized
**Solution:**
- [ ] User must be logged in
- [ ] Token must be valid and not expired
- [ ] Token format: `Bearer <token>`

### Issue: No tables showing as available
**Solution:**
- [ ] Create sample table data (see Test 3 above)
- [ ] Check hawker_centre_id matches
- [ ] Select a future date
- [ ] Check database tables exist

## Next Steps After Setup

1. ✅ Complete all checklist items above
2. 📚 Review `RESERVATION_FEATURE.md` for API details
3. 🧪 Run through all test cases
4. 🎨 Customize colors if needed
5. 📱 Test on mobile devices
6. 🚀 Deploy to production

## Support Resources

- **API Reference**: See `RESERVATION_FEATURE.md`
- **Integration Guide**: See `INTEGRATION_GUIDE.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Code Comments**: Check JSDoc comments in source files
- **Error Messages**: Check browser console and server logs

## Quick Reference

### Database Tables
- `table_inventory` - Physical tables
- `reservations` - Customer reservations
- `reservation_items` - Pre-ordered items

### Main Components
- `ReservationsPage` - Main page with tabs
- `Reservation` - Form to make reservation
- `ReservationHistory` - View past reservations

### Key Routes
- `GET /api/reservations` - List user's reservations
- `POST /api/reservations` - Create reservation
- `DELETE /api/reservations/:id` - Cancel reservation
- `GET /api/reservations/available-tables` - Check availability

## Feature Completeness

✅ Database Schema - Complete
✅ Backend Model - Complete
✅ Backend Controller - Complete
✅ Backend Routes - Complete
✅ Frontend Components - Complete
✅ Frontend Pages - Complete
✅ Documentation - Complete
✅ Error Handling - Complete
✅ Validation - Complete
✅ Responsive Design - Complete
✅ Authentication - Complete
✅ Authorization - Complete

## 🎉 Ready to Go!

All files are created and configured. Follow the checklist above to integrate into your application.

**Estimated Integration Time**: 15-30 minutes
**Estimated Testing Time**: 20-30 minutes
**Total**: ~1 hour to full deployment

For questions, refer to the documentation files or review the code comments.

Good luck! 🚀
