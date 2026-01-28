# Reservation Feature Documentation

## Overview

The Reservation feature allows customers to reserve tables at hawker centres for dine-in dining. Customers can select a specific hawker centre, choose an available table based on their preferred date and time, specify their party size, and add special requests for their dining experience. Stall owners can then deliver food to the reserved table.

## Features

### Customer Features
- **Make Reservations**: Select hawker centre, date, time, table, and party size
- **Table Availability**: Real-time availability checking to prevent double-bookings
- **Pre-Order Items**: (Optional) Add items from different stalls when making a reservation
- **Special Requests**: Add dietary preferences, seating preferences, or special requirements
- **View Reservation History**: Track all past and upcoming reservations
- **Cancel Reservations**: Cancel pending or confirmed reservations
- **Contact Information**: Store phone number for restaurant communication

### Stall Owner Features
- **View Reservations**: See all upcoming reservations for their hawker centre
- **Reservation Statistics**: Track reservation trends and party sizes
- **Delivery to Tables**: Fulfill orders for reserved tables

### Admin Features
- **Manage Tables**: Create and manage table inventory for hawker centres
- **Monitor Reservations**: View all reservations across the platform
- **Generate Reports**: Access reservation statistics and trends

## Database Schema

### Tables Created

#### 1. `table_inventory`
Stores information about available tables in each hawker centre.

```sql
- id (INT, Primary Key)
- hawker_centre_id (INT, Foreign Key)
- table_number (INT) - Display number for the table
- seating_capacity (INT) - Number of seats at the table
- location_description (VARCHAR) - e.g., "Corner booth", "Near window"
- is_available (BIT) - Soft delete flag
- created_at (DATETIME2)
- updated_at (DATETIME2)
```

**Unique Constraint**: `(hawker_centre_id, table_number)` - No duplicate table numbers per centre

#### 2. `reservations`
Stores reservation records for customers.

```sql
- id (INT, Primary Key)
- user_id (INT, Foreign Key) - Customer who made the reservation
- hawker_centre_id (INT, Foreign Key) - Hawker centre location
- table_id (INT, Foreign Key) - Specific table reserved
- table_number (INT) - Display number (for quick reference)
- reservation_date (DATE) - Date of reservation
- reservation_time (TIME) - Time of reservation
- duration_minutes (INT) - Expected duration (default: 120 min)
- party_size (INT) - Number of people
- status (NVARCHAR(50)) - Pending, Confirmed, In Progress, Completed, Cancelled
- special_requests (NVARCHAR(MAX)) - Customer requests
- contact_phone (NVARCHAR(20)) - Contact number
- notes (NVARCHAR(MAX)) - Admin notes
- created_at (DATETIME2)
- updated_at (DATETIME2)
```

**Status Flow**:
- `Pending` → `Confirmed` → `In Progress` → `Completed`
- Can be `Cancelled` at any point before completion

#### 3. `reservation_items`
Stores pre-ordered items for a reservation (optional feature for pre-ordering from stalls).

```sql
- id (INT, Primary Key)
- reservation_id (INT, Foreign Key) - Parent reservation
- stall_id (INT, Foreign Key) - Which stall the item is from
- food_item_id (INT, Foreign Key) - The food item ordered
- quantity (INT) - Number of items
- notes (NVARCHAR(MAX)) - Special requests for this item
- created_at (DATETIME2)
```

## API Endpoints

### User Endpoints (Authenticated)

#### Make a Reservation
```http
POST /api/reservations
Content-Type: application/json
Authorization: Bearer <token>

{
  "hawkerCentreId": 1,
  "tableId": 5,
  "tableNumber": 5,
  "reservationDate": "2026-02-15",
  "reservationTime": "18:30",
  "partySize": 4,
  "specialRequests": "Near window, high chair needed",
  "contactPhone": "+6581234567"
}

Response:
{
  "success": true,
  "message": "Reservation created successfully",
  "data": {
    "id": 123,
    "user_id": 5,
    "hawker_centre_id": 1,
    "table_id": 5,
    "status": "Confirmed",
    "created_at": "2026-01-28T10:30:00Z"
  }
}
```

#### Get My Reservations
```http
GET /api/reservations
Authorization: Bearer <token>

Response:
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 123,
      "hawker_centres": {
        "id": 1,
        "name": "Maxwell Food Centre",
        "address": "1 Kadayanallur Street"
      },
      "table_inventory": {
        "table_number": 5,
        "seating_capacity": 4
      },
      "reservation_date": "2026-02-15",
      "reservation_time": "18:30",
      "party_size": 4,
      "status": "Confirmed"
    }
  ]
}
```

#### Get Specific Reservation
```http
GET /api/reservations/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": { /* full reservation details */ }
}
```

#### Update Reservation
```http
PUT /api/reservations/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "In Progress",
  "specialRequests": "Updated requests",
  "contactPhone": "+6581234567"
}

Response:
{
  "success": true,
  "message": "Reservation updated successfully",
  "data": { /* updated reservation */ }
}
```

#### Cancel Reservation
```http
DELETE /api/reservations/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Reservation cancelled successfully",
  "data": { /* cancelled reservation */ }
}
```

#### Get Available Tables
```http
GET /api/reservations/available-tables?hawkerCentreId=1&reservationDate=2026-02-15&reservationTime=18:30&duration=120

Response:
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 5,
      "table_number": 5,
      "seating_capacity": 4,
      "location_description": "Corner booth"
    },
    {
      "id": 6,
      "table_number": 6,
      "seating_capacity": 2,
      "location_description": "Near window"
    }
  ]
}
```

#### Add Pre-Order Items
```http
POST /api/reservations/:id/items
Content-Type: application/json
Authorization: Bearer <token>

{
  "stallId": 10,
  "foodItemId": 45,
  "quantity": 2,
  "notes": "Less salt please"
}

Response:
{
  "success": true,
  "message": "Item added to reservation",
  "data": { /* reservation item */ }
}
```

#### Get Reservation Items
```http
GET /api/reservations/:id/items
Authorization: Bearer <token>

Response:
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "stalls": {
        "id": 10,
        "stall_name": "The Noodle House"
      },
      "food_items": {
        "id": 45,
        "name": "Chicken Noodles",
        "price": 5.50
      },
      "quantity": 2,
      "notes": "Less salt please"
    }
  ]
}
```

#### Delete Reservation Item
```http
DELETE /api/reservations/:id/items/:itemId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Item removed from reservation"
}
```

### Hawker Centre Endpoints

#### Get All Tables for Hawker Centre
```http
GET /api/hawker-centres/:hawkerCentreId/tables

Response:
{
  "success": true,
  "count": 20,
  "data": [
    {
      "id": 1,
      "table_number": 1,
      "seating_capacity": 4,
      "location_description": "Main area"
    },
    /* ... more tables ... */
  ]
}
```

#### Get Hawker Centre Reservations
```http
GET /api/hawker-centres/:hawkerCentreId/reservations?fromDate=2026-02-01&toDate=2026-02-28

Response:
{
  "success": true,
  "count": 15,
  "data": [
    {
      "id": 123,
      "users": {
        "id": 5,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "reservation_date": "2026-02-15",
      "reservation_time": "18:30",
      "party_size": 4,
      "status": "Confirmed"
    }
  ]
}
```

#### Get Reservation Statistics
```http
GET /api/hawker-centres/:hawkerCentreId/reservation-stats?days=30

Response:
{
  "success": true,
  "data": {
    "totalReservations": 45,
    "confirmedReservations": 40,
    "completedReservations": 30,
    "cancelledReservations": 5,
    "totalPartySize": 180,
    "averagePartySize": 4.0
  }
}
```

## Frontend Components

### 1. Reservation Component (`Reservation.jsx`)
Main component for creating new reservations.

**Props:**
- `hawkerCentreId` (optional): Pre-fill the hawker centre ID
- `onReservationCreated` (function): Callback when reservation is successfully created

**Features:**
- Form for reservation details
- Real-time table availability checking
- Date/time picker with validation
- Party size selector
- Special requests textarea
- Contact phone field

### 2. ReservationHistory Component (`ReservationHistory.jsx`)
Display and manage user's reservations.

**Features:**
- List all user reservations
- Filter by status (All, Upcoming, Completed, Cancelled)
- View detailed reservation information
- Cancel reservations
- Formatted dates and times

### 3. ReservationsPage (`ReservationsPage.jsx`)
Full-page view with tabbed interface.

**Tabs:**
- Make a Reservation
- My Reservations

## Usage Examples

### For Customers

1. **Make a Reservation:**
   - Navigate to `/reservations`
   - Click "Make a Reservation" tab
   - Select hawker centre
   - Choose date and time
   - View available tables
   - Select a table
   - Enter party size and special requests
   - Click "Create Reservation"

2. **View Reservations:**
   - Click "My Reservations" tab
   - View all your reservations
   - Filter by status (Upcoming, Completed, etc.)
   - Cancel reservations if needed

### For Stall Owners

1. **View Reservations:**
   ```javascript
   // Fetch reservations for your hawker centre
   GET /api/hawker-centres/1/reservations
   ```

2. **Check Statistics:**
   ```javascript
   // Get reservation stats for the past 30 days
   GET /api/hawker-centres/1/reservation-stats?days=30
   ```

3. **Prepare for Reserved Tables:**
   - Check dashboard for upcoming reservations
   - Prepare food in advance
   - Deliver to the correct table number

## Setup Instructions

### Backend Setup

1. **Run Database Migrations:**
   ```bash
   # Execute the init-schema.sql file to create tables
   # The reservation tables will be created:
   # - table_inventory
   # - reservations
   # - reservation_items
   ```

2. **Verify Routes:**
   The routes are automatically configured in `app.js`:
   - ReservationController is imported
   - Routes are registered if controller loads successfully

### Frontend Setup

1. **Add to App Router:**
   ```jsx
   import ReservationsPage from './pages/ReservationsPage';
   
   // In your router configuration:
   <Route path="/reservations" element={<ReservationsPage />} />
   ```

2. **Add Navigation Link:**
   ```jsx
   // In Header or Navigation component:
   <Link to="/reservations">My Reservations</Link>
   ```

3. **Use Component in Other Pages:**
   ```jsx
   import Reservation from './components/Reservation';
   
   // In your hawker centre detail page:
   <Reservation 
     hawkerCentreId={hawkerCentreId}
     onReservationCreated={handleReservationCreated}
   />
   ```

## Business Logic

### Availability Checking
- When a user selects a date and time, the system checks for conflicting reservations
- A table is considered unavailable if there's an overlapping reservation
- Overlap detection considers the reservation duration (default: 120 minutes)

### Status Management
- **Pending**: Initial status when reservation is created
- **Confirmed**: Reservation is confirmed by the system
- **In Progress**: Customer has arrived and is dining
- **Completed**: Reservation completed successfully
- **Cancelled**: Customer or system cancelled the reservation

### Validation Rules
1. Reservation date must be at least 1 day in the future
2. Reservation time must be valid (between hawker centre operating hours)
3. Party size must be 1-8+ people
4. Table seating capacity should accommodate party size (checked at UI level)
5. Cannot cancel completed or already cancelled reservations

## Error Handling

| Error | Status | Message |
|-------|--------|---------|
| Missing fields | 400 | "Missing required fields" |
| Invalid date | 400 | "Reservation date and time must be in the future" |
| Table unavailable | 409 | "Table is not available at the requested time" |
| Unauthorized | 403 | "Unauthorized" |
| Not found | 404 | "Reservation not found" |
| Server error | 500 | Error message from server |

## Future Enhancements

1. **Notifications**
   - SMS/Email reminder before reservation time
   - Notification when food is ready

2. **Advanced Features**
   - Reservation deposit/payment
   - Automatic status updates
   - Waitlist functionality
   - Recurring reservations

3. **Admin Dashboard**
   - Comprehensive reservation management
   - Table configuration UI
   - Analytics and insights

4. **Integration**
   - POS system integration
   - Payment gateway integration
   - Customer loyalty program integration

## Testing

### Example Test Cases

```javascript
// Test: Create reservation
POST /api/reservations
Headers: Authorization: Bearer <token>
Body: {
  hawkerCentreId: 1,
  tableId: 5,
  tableNumber: 5,
  reservationDate: "2026-02-15",
  reservationTime: "18:30",
  partySize: 4
}

// Test: Get available tables
GET /api/reservations/available-tables?hawkerCentreId=1&reservationDate=2026-02-15&reservationTime=18:30&duration=120

// Test: Cancel reservation
DELETE /api/reservations/123
Headers: Authorization: Bearer <token>
```

## API Response Format

All API responses follow a consistent format:

**Success Response (2xx):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

**Error Response (4xx, 5xx):**
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Performance Considerations

1. **Indexes**: Database indexes on frequently queried fields:
   - `hawker_centre_id` in `table_inventory`
   - `reservation_date` and `reservation_time` in `reservations`
   - `user_id` for user-specific queries

2. **Availability Calculation**: Implemented efficiently with:
   - Single query to get all tables
   - Separate query to get conflicting reservations
   - In-memory overlap detection

3. **Caching**: Consider caching:
   - Hawker centre table lists (static data)
   - Reservation statistics

## Support

For issues or questions about the reservation feature:
1. Check the API documentation above
2. Review error messages in the Toast component
3. Check browser console for JavaScript errors
4. Review server logs for backend errors
