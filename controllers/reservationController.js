const supabase = require('../dbConfig');

class ReservationController {
  // Get all tables for a specific hawker centre
  static async getTablesByHawkerCentre(req, res) {
    try {
      const { hawkerCentreId } = req.params;

      if (!hawkerCentreId) {
        return res.status(400).json({ error: 'Hawker centre ID is required' });
      }

      const { data, error } = await supabase
        .from('hawker_seats')
        .select('*')
        .eq('hawker_centre_id', hawkerCentreId)
        .order('table_code', { ascending: true });

      if (error) {
        console.error('Error fetching tables:', error);
        return res.status(500).json({ error: 'Failed to fetch tables' });
      }

      res.json(data || []);
    } catch (err) {
      console.error('Error in getTablesByHawkerCentre:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get reservations for a specific table on a specific date
  static async getTableReservations(req, res) {
    try {
      const { tableId } = req.params;
      const { date } = req.query;

      if (!tableId || !date) {
        return res.status(400).json({ error: 'Table ID and date are required' });
      }

      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('seat_id', tableId)
        .eq('reservation_date', date)
        .neq('status', 'Cancelled')
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching reservations:', error);
        return res.status(500).json({ error: 'Failed to fetch reservations' });
      }

      res.json(data || []);
    } catch (err) {
      console.error('Error in getTableReservations:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create a new reservation
  static async createReservation(req, res) {
    try {
      console.log('\n=== CREATE RESERVATION REQUEST ===');
      console.log('req.user:', JSON.stringify(req.user, null, 2));
      console.log('req.body:', JSON.stringify(req.body, null, 2));

      const { hawkerCentreId, seatId, reservationDate, startTime, endTime, specialRequests } = req.body;
      const userId = req.user?.userId || req.user?.user_id;

      console.log('Extracted userId:', userId);
      console.log('Expected fields:');
      console.log('  - userId:', userId ? '✓' : '✗');
      console.log('  - hawkerCentreId:', hawkerCentreId ? '✓' : '✗');
      console.log('  - seatId:', seatId ? '✓' : '✗');
      console.log('  - reservationDate:', reservationDate ? '✓' : '✗');
      console.log('  - startTime:', startTime ? '✓' : '✗');
      console.log('  - endTime:', endTime ? '✓' : '✗');

      // Validate required fields with specific error messages
      if (!userId) {
        return res.status(400).json({ error: 'Missing userId from authentication' });
      }
      if (!hawkerCentreId) {
        return res.status(400).json({ error: 'Missing hawkerCentreId' });
      }
      if (!seatId) {
        return res.status(400).json({ error: 'Missing seatId' });
      }
      if (!reservationDate) {
        return res.status(400).json({ error: 'Missing reservationDate' });
      }
      if (!startTime) {
        return res.status(400).json({ error: 'Missing startTime' });
      }
      if (!endTime) {
        return res.status(400).json({ error: 'Missing endTime' });
      }

      // Check if reservation is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const reservationDateObj = new Date(reservationDate);
      reservationDateObj.setHours(0, 0, 0, 0);

      if (reservationDateObj < today) {
        return res.status(400).json({ error: 'Cannot make reservations for past dates' });
      }

      // If reservation is for today, check if the start time hasn't passed
      if (reservationDateObj.getTime() === today.getTime()) {
        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;

        if (startTime <= currentTime) {
          return res.status(400).json({ error: 'Cannot make reservations for times that have already passed' });
        }
      }

      // Check for conflicting reservations
      const { data: conflicts, error: conflictError } = await supabase
        .from('reservations')
        .select('*')
        .eq('seat_id', seatId)
        .eq('reservation_date', reservationDate)
        .neq('status', 'Cancelled');

      if (conflictError) {
        console.error('Error checking conflicts:', conflictError);
        return res.status(500).json({ error: 'Failed to check availability' });
      }

      // Check if any reservation overlaps with the requested time slot
      // Convert times to minutes for accurate comparison
      const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const requestedStart = timeToMinutes(startTime);
      const requestedEnd = timeToMinutes(endTime);

      const hasConflict = conflicts && conflicts.some(res => {
        const existingStart = timeToMinutes(res.start_time);
        const existingEnd = timeToMinutes(res.end_time);
        // Overlap occurs when: existing starts before requested ends AND existing ends after requested starts
        return existingStart < requestedEnd && existingEnd > requestedStart;
      });

      if (hasConflict) {
        return res.status(409).json({ error: 'This table is already reserved for that time slot. Please choose a different time.' });
      }

      // Create the reservation
      const { data, error } = await supabase
        .from('reservations')
        .insert([
          {
            user_id: userId,
            hawker_centre_id: hawkerCentreId,
            seat_id: seatId,
            reservation_date: reservationDate,
            start_time: startTime,
            end_time: endTime,
            status: 'Confirmed',
            special_requests: specialRequests || null,
            notes: null
          }
        ])
        .select();

      if (error) {
        console.error('Error creating reservation:', error);
        return res.status(500).json({ error: 'Failed to create reservation' });
      }

      res.status(201).json({ message: 'Reservation created successfully', data: data[0] });
    } catch (err) {
      console.error('Error in createReservation:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get all reservations for the logged-in user
  static async getUserReservations(req, res) {
    try {
      const userId = req.user?.id || req.query.userId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID is required' });
      }

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          hawker_centres:hawker_centre_id(name, address),
          hawker_seats:seat_id(table_code, capacity, zone)
        `)
        .eq('user_id', userId)
        .neq('status', 'Cancelled')
        .order('reservation_date', { ascending: false })
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error fetching user reservations:', error);
        return res.status(500).json({ error: 'Failed to fetch reservations' });
      }

      res.json(data || []);
    } catch (err) {
      console.error('Error in getUserReservations:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Cancel a reservation
  static async cancelReservation(req, res) {
    try {
      const { reservationId } = req.params;
      const userId = req.user?.userId || req.user?.user_id;

      if (!reservationId) {
        return res.status(400).json({ error: 'Reservation ID is required' });
      }

      // Verify the reservation belongs to the user
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select('user_id')
        .eq('id', reservationId)
        .single();

      if (fetchError || !reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      if (reservation.user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized to cancel this reservation' });
      }

      // Update reservation status to Cancelled
      const { data, error } = await supabase
        .from('reservations')
        .update({ status: 'Cancelled' })
        .eq('id', reservationId)
        .select();

      if (error) {
        console.error('Error cancelling reservation:', error);
        return res.status(500).json({ error: 'Failed to cancel reservation' });
      }

      res.json({ message: 'Reservation cancelled successfully', data: data[0] });
    } catch (err) {
      console.error('Error in cancelReservation:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get available time slots for a table on a specific date
  static async getAvailableSlots(req, res) {
    try {
      const { tableId, date } = req.query;

      if (!tableId || !date) {
        return res.status(400).json({ error: 'Table ID and date are required' });
      }

      // Fetch existing reservations for this table on this date
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select('start_time, end_time')
        .eq('seat_id', tableId)
        .eq('reservation_date', date)
        .neq('status', 'Cancelled');

      if (error) {
        console.error('Error fetching reservations:', error);
        return res.status(500).json({ error: 'Failed to fetch reservations' });
      }

      // Generate 30-minute slots from 10:00 to 22:00
      const slots = [];
      for (let hour = 10; hour < 22; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          
          // Check if this slot conflicts with any reservation
          const isAvailable = !reservations.some(res => {
            return timeStr >= res.start_time && timeStr < res.end_time;
          });

          slots.push({
            time: timeStr,
            available: isAvailable
          });
        }
      }

      res.json(slots);
    } catch (err) {
      console.error('Error in getAvailableSlots:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = ReservationController;
