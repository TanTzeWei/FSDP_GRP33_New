# Database Integration Guide - Table Reservation Feature

## Quick Reference

### What Changed?
✅ LocationMap component now pulls table data from Supabase database
✅ No longer uses hardcoded placeholder data
✅ Real-time availability checking from database

### Where Does It Pull From?

#### **Primary Table: `hawker_seats`**
```
Location: Supabase → hawker_hub database → hawker_seats table

Columns Used:
- id (table identifier)
- hawker_centre_id (which hawker centre)
- table_code (A01, B02, etc.)
- capacity (2, 4, 6, 8, 10 seats)
- zone (North Wing, South Wing, Central Area, Near Fan)
- is_shared (true/false for communal tables)
- status (Available, Reserved, Occupied, Out of Service)
- qr_code_url (QR code for check-in)
- notes (additional info)

API Call: GET /api/hawker-centres/{hawkerCentreId}/tables
SQL Query: SELECT * FROM hawker_seats WHERE hawker_centre_id = {id}
```

#### **Secondary Table: `reservations`**
```
Location: Supabase → hawker_hub database → reservations table

Columns Used:
- id (reservation identifier)
- seat_id (which table - links to hawker_seats.id)
- reservation_date (date of reservation)
- start_time (start time)
- end_time (end time)
- status (Pending, Confirmed, Cancelled, Completed, No-Show)
- user_id (who made the reservation)
- special_requests (customer requests)

API Call: GET /api/tables/{tableId}/reservations?date={date}
SQL Query: SELECT * FROM reservations WHERE seat_id = {id} AND reservation_date = {date}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│                   LocationMap.jsx                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    User clicks "Reserve Table"
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              openReservationModal() called                   │
│                                                              │
│  fetch('http://localhost:3000/api/hawker-centres/1/tables') │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js/Express)                  │
│                                                              │
│  GET /api/hawker-centres/:hawkerCentreId/tables             │
│  ReservationController.getTablesByHawkerCentre()            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE DATABASE (PostgreSQL)                 │
│                                                              │
│  SELECT * FROM hawker_seats                                 │
│  WHERE hawker_centre_id = 1                                 │
│  ORDER BY table_code ASC                                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
                  Returns array of tables
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│                                                              │
│  setTables(data.data)                                       │
│  Displays tables organized by zone                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    User selects date
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              handleDateChange() called                       │
│                                                              │
│  fetch('http://localhost:3000/api/tables/1/reservations?date=2026-02-15')
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js/Express)                  │
│                                                              │
│  GET /api/tables/:tableId/reservations?date=YYYY-MM-DD      │
│  ReservationController.getTableReservations()               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE DATABASE (PostgreSQL)                 │
│                                                              │
│  SELECT * FROM reservations                                 │
│  WHERE seat_id = 1                                          │
│  AND reservation_date = '2026-02-15'                        │
│  AND status IN ('Pending', 'Confirmed')                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
              Returns array of reservations
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│                                                              │
│  setTableReservations(prev => {...})                        │
│  Displays existing reservations for table                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
                User confirms reservation
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              handleReservationSubmit() called                │
│                                                              │
│  fetch('http://localhost:3000/api/reservations', {          │
│    method: 'POST',                                          │
│    body: {                                                  │
│      hawkerCentreId: 1,                                     │
│      seatId: 1,                                             │
│      reservationDate: '2026-02-15',                         │
│      startTime: '12:00',                                    │
│      endTime: '13:00'                                       │
│    }                                                        │
│  })                                                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js/Express)                  │
│                                                              │
│  POST /api/reservations                                     │
│  ReservationController.createReservation()                  │
│                                                              │
│  1. Validate inputs                                         │
│  2. Check table exists and is available                     │
│  3. Check for overlapping reservations                      │
│  4. Create reservation                                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE DATABASE (PostgreSQL)                 │
│                                                              │
│  INSERT INTO reservations (                                 │
│    user_id, hawker_centre_id, seat_id,                      │
│    reservation_date, start_time, end_time,                  │
│    status, created_at                                       │
│  ) VALUES (...)                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
              Returns created reservation
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│                                                              │
│  setReservationSuccess(message)                             │
│  Shows confirmation for 2 seconds                           │
│  Closes modal                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## State Variables

```javascript
// Tables from database
const [tables, setTables] = useState([]);
// Example: [
//   { id: 1, table_code: 'A01', capacity: 2, zone: 'North Wing', status: 'Available', is_shared: false },
//   { id: 2, table_code: 'A02', capacity: 4, zone: 'North Wing', status: 'Available', is_shared: false },
//   ...
// ]

// Reservations by table ID
const [tableReservations, setTableReservations] = useState({});
// Example: {
//   1: [
//     { id: 1, seat_id: 1, start_time: '12:00', end_time: '13:00', status: 'Confirmed' },
//     { id: 2, seat_id: 1, start_time: '14:00', end_time: '15:00', status: 'Pending' }
//   ],
//   2: [...]
// }

// Loading state
const [loadingTables, setLoadingTables] = useState(false);

// Error messages
const [reservationError, setReservationError] = useState('');

// Success messages
const [reservationSuccess, setReservationSuccess] = useState('');
```

---

## API Endpoints

### 1. Get Tables for Hawker Centre
```
GET /api/hawker-centres/{hawkerCentreId}/tables

Response:
{
  "data": [
    {
      "id": 1,
      "hawker_centre_id": 1,
      "table_code": "A01",
      "capacity": 2,
      "zone": "North Wing",
      "is_shared": false,
      "status": "Available",
      "qr_code_url": "https://...",
      "notes": null,
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-01-15T10:00:00Z"
    },
    ...
  ]
}
```

### 2. Get Reservations for Table
```
GET /api/tables/{tableId}/reservations?date=2026-02-15

Response:
{
  "data": [
    {
      "id": 1,
      "seat_id": 1,
      "reservation_date": "2026-02-15",
      "start_time": "12:00",
      "end_time": "13:00",
      "status": "Confirmed",
      "users": { "name": "John Doe", "email": "john@example.com" }
    },
    ...
  ]
}
```

### 3. Create Reservation
```
POST /api/reservations

Request:
{
  "hawkerCentreId": 1,
  "seatId": 1,
  "reservationDate": "2026-02-15",
  "startTime": "12:00",
  "endTime": "13:00",
  "specialRequests": ""
}

Response:
{
  "message": "Reservation created successfully",
  "data": {
    "id": 1,
    "user_id": 5,
    "hawker_centre_id": 1,
    "seat_id": 1,
    "reservation_date": "2026-02-15",
    "start_time": "12:00",
    "end_time": "13:00",
    "status": "Pending",
    "created_at": "2026-01-31T10:30:00Z"
  }
}
```

---

## Key Functions

### `openReservationModal()`
- Opens reservation modal
- Fetches tables from database
- Shows loading spinner

### `handleDateChange(e)`
- Updates reservation date
- Fetches reservations for selected table on new date

### `handleTableSelect(table)`
- Selects a table
- Fetches existing reservations for that table

### `handleReservationSubmit()`
- Validates inputs
- Creates reservation via API
- Shows success/error message

### `getTableReservations(tableId)`
- Returns reservations for a table from state

---

## Testing

### Prerequisites
- Backend running: `node app.js`
- Frontend running: `npm run dev`
- Sample table data in database
- User logged in

### Test Steps
1. Navigate to hawker centre
2. Click "Reserve Table"
3. Verify tables load from database
4. Select a date
5. Click on an available table
6. Verify existing reservations display
7. Confirm reservation
8. Verify success message

---

## Troubleshooting

### Tables not loading?
- Check backend is running
- Check API endpoint: `GET /api/hawker-centres/{id}/tables`
- Check browser console for errors
- Verify hawker_seats table has data

### Reservations not showing?
- Check date is selected
- Check API endpoint: `GET /api/tables/{id}/reservations?date={date}`
- Verify reservations table has data for that date

### Reservation creation fails?
- Check user is logged in (token in localStorage)
- Check all fields are filled
- Check for overlapping reservations
- Check backend logs for errors

---

## Summary

| Component | Source | Purpose |
|-----------|--------|---------|
| Tables | `hawker_seats` table | Display available tables |
| Reservations | `reservations` table | Show existing bookings |
| Availability | `hawker_seats.status` | Determine if table can be booked |
| Conflicts | `reservations` table | Prevent double-booking |

**Status: ✅ COMPLETE AND READY TO USE**
