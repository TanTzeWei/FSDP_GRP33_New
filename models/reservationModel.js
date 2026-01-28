const supabase = require('../dbConfig');

class ReservationModel {
    /**
     * Create a new reservation
     */
    static async createReservation(userId, hawkerCentreId, tableId, tableNumber, reservationDate, reservationTime, partySize, specialRequests = null, contactPhone = null) {
        try {
            const { data, error } = await supabase
                .from('reservations')
                .insert([{
                    user_id: userId,
                    hawker_centre_id: hawkerCentreId,
                    table_id: tableId,
                    table_number: tableNumber,
                    reservation_date: reservationDate,
                    reservation_time: reservationTime,
                    party_size: partySize,
                    special_requests: specialRequests,
                    contact_phone: contactPhone,
                    status: 'Confirmed'
                }])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            throw new Error(`Error creating reservation: ${error.message}`);
        }
    }

    /**
     * Get reservation by ID
     */
    static async getReservationById(reservationId) {
        try {
            const { data, error } = await supabase
                .from('reservations')
                .select(`
                    *,
                    hawker_centres(id, name, address, latitude, longitude),
                    table_inventory(table_number, seating_capacity, location_description),
                    users(name, email)
                `)
                .eq('id', reservationId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error fetching reservation: ${error.message}`);
        }
    }

    /**
     * Get all reservations for a user
     */
    static async getUserReservations(userId) {
        try {
            const { data, error } = await supabase
                .from('reservations')
                .select(`
                    *,
                    hawker_centres(id, name, address, latitude, longitude, image_url),
                    table_inventory(table_number, seating_capacity, location_description)
                `)
                .eq('user_id', userId)
                .order('reservation_date', { ascending: false })
                .order('reservation_time', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            throw new Error(`Error fetching user reservations: ${error.message}`);
        }
    }

    /**
     * Get all reservations for a hawker centre (for stall owners/admin)
     */
    static async getHawkerCentreReservations(hawkerCentreId, fromDate = null, toDate = null) {
        try {
            let query = supabase
                .from('reservations')
                .select(`
                    *,
                    users(id, name, email, phone),
                    table_inventory(table_number, seating_capacity)
                `)
                .eq('hawker_centre_id', hawkerCentreId)
                .order('reservation_date', { ascending: true })
                .order('reservation_time', { ascending: true });

            // Filter by date range if provided
            if (fromDate) {
                query = query.gte('reservation_date', fromDate);
            }
            if (toDate) {
                query = query.lte('reservation_date', toDate);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            throw new Error(`Error fetching hawker centre reservations: ${error.message}`);
        }
    }

    /**
     * Get available tables for a specific date and time
     */
    static async getAvailableTables(hawkerCentreId, reservationDate, reservationTime, duration = 120) {
        try {
            // Get all tables for this hawker centre
            const { data: allTables, error: tableError } = await supabase
                .from('table_inventory')
                .select('*')
                .eq('hawker_centre_id', hawkerCentreId)
                .eq('is_available', true);

            if (tableError) throw tableError;

            // Get reservations that overlap with the requested time slot
            const startTime = this.timeToMinutes(reservationTime);
            const endTime = startTime + duration;

            const { data: conflictingReservations, error: reservError } = await supabase
                .from('reservations')
                .select('table_id')
                .eq('hawker_centre_id', hawkerCentreId)
                .eq('reservation_date', reservationDate)
                .in('status', ['Pending', 'Confirmed', 'In Progress']);

            if (reservError) throw reservError;

            // For each conflicting reservation, check if it overlaps with our requested time
            const bookedTableIds = new Set();
            for (const res of conflictingReservations) {
                const { data: resData } = await supabase
                    .from('reservations')
                    .select('reservation_time, duration_minutes')
                    .eq('id', res.id)
                    .single();

                if (resData) {
                    const resStart = this.timeToMinutes(resData.reservation_time);
                    const resEnd = resStart + (resData.duration_minutes || 120);
                    
                    // Check for overlap
                    if (!(endTime <= resStart || startTime >= resEnd)) {
                        bookedTableIds.add(res.table_id);
                    }
                }
            }

            // Filter out booked tables
            const availableTables = allTables.filter(table => !bookedTableIds.has(table.id));
            return availableTables;
        } catch (error) {
            throw new Error(`Error fetching available tables: ${error.message}`);
        }
    }

    /**
     * Convert time string (HH:mm) to minutes since midnight
     */
    static timeToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Update reservation status
     */
    static async updateReservationStatus(reservationId, status) {
        try {
            const { data, error } = await supabase
                .from('reservations')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', reservationId)
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            throw new Error(`Error updating reservation status: ${error.message}`);
        }
    }

    /**
     * Cancel a reservation
     */
    static async cancelReservation(reservationId) {
        try {
            return await this.updateReservationStatus(reservationId, 'Cancelled');
        } catch (error) {
            throw new Error(`Error cancelling reservation: ${error.message}`);
        }
    }

    /**
     * Update reservation details
     */
    static async updateReservation(reservationId, updates) {
        try {
            const { data, error } = await supabase
                .from('reservations')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', reservationId)
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            throw new Error(`Error updating reservation: ${error.message}`);
        }
    }

    /**
     * Add item to reservation
     */
    static async addReservationItem(reservationId, stallId, foodItemId = null, quantity = 1, notes = null) {
        try {
            const { data, error } = await supabase
                .from('reservation_items')
                .insert([{
                    reservation_id: reservationId,
                    stall_id: stallId,
                    food_item_id: foodItemId,
                    quantity,
                    notes
                }])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            throw new Error(`Error adding reservation item: ${error.message}`);
        }
    }

    /**
     * Get reservation items
     */
    static async getReservationItems(reservationId) {
        try {
            const { data, error } = await supabase
                .from('reservation_items')
                .select(`
                    *,
                    stalls(id, stall_name, description),
                    food_items(id, name, price, description)
                `)
                .eq('reservation_id', reservationId);

            if (error) throw error;
            return data || [];
        } catch (error) {
            throw new Error(`Error fetching reservation items: ${error.message}`);
        }
    }

    /**
     * Delete reservation item
     */
    static async deleteReservationItem(itemId) {
        try {
            const { error } = await supabase
                .from('reservation_items')
                .delete()
                .eq('id', itemId);

            if (error) throw error;
            return true;
        } catch (error) {
            throw new Error(`Error deleting reservation item: ${error.message}`);
        }
    }

    /**
     * Get all tables for a hawker centre
     */
    static async getHawkerCentreTables(hawkerCentreId) {
        try {
            const { data, error } = await supabase
                .from('table_inventory')
                .select('*')
                .eq('hawker_centre_id', hawkerCentreId)
                .order('table_number', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            throw new Error(`Error fetching hawker centre tables: ${error.message}`);
        }
    }

    /**
     * Create table inventory for a hawker centre
     */
    static async createTable(hawkerCentreId, tableNumber, seatingCapacity = 4, locationDescription = null) {
        try {
            const { data, error } = await supabase
                .from('table_inventory')
                .insert([{
                    hawker_centre_id: hawkerCentreId,
                    table_number: tableNumber,
                    seating_capacity: seatingCapacity,
                    location_description: locationDescription
                }])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            throw new Error(`Error creating table: ${error.message}`);
        }
    }

    /**
     * Check if a table is available at a specific time
     */
    static async isTableAvailable(tableId, reservationDate, reservationTime, duration = 120) {
        try {
            const startTime = this.timeToMinutes(reservationTime);
            const endTime = startTime + duration;

            const { data, error } = await supabase
                .from('reservations')
                .select('id, reservation_time, duration_minutes')
                .eq('table_id', tableId)
                .eq('reservation_date', reservationDate)
                .in('status', ['Pending', 'Confirmed', 'In Progress']);

            if (error) throw error;

            // Check for overlapping reservations
            for (const res of data || []) {
                const resStart = this.timeToMinutes(res.reservation_time);
                const resEnd = resStart + (res.duration_minutes || 120);
                
                // If there's an overlap, table is not available
                if (!(endTime <= resStart || startTime >= resEnd)) {
                    return false;
                }
            }

            return true;
        } catch (error) {
            throw new Error(`Error checking table availability: ${error.message}`);
        }
    }

    /**
     * Get reservation statistics for a hawker centre
     */
    static async getHawkerCentreReservationStats(hawkerCentreId, days = 30) {
        try {
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - days);
            const fromDateStr = fromDate.toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('reservations')
                .select('*')
                .eq('hawker_centre_id', hawkerCentreId)
                .gte('reservation_date', fromDateStr);

            if (error) throw error;

            const stats = {
                totalReservations: data.length,
                confirmedReservations: data.filter(r => r.status === 'Confirmed').length,
                completedReservations: data.filter(r => r.status === 'Completed').length,
                cancelledReservations: data.filter(r => r.status === 'Cancelled').length,
                totalPartySize: data.reduce((sum, r) => sum + r.party_size, 0),
                averagePartySize: data.length > 0 ? Math.round(data.reduce((sum, r) => sum + r.party_size, 0) / data.length * 10) / 10 : 0
            };

            return stats;
        } catch (error) {
            throw new Error(`Error fetching reservation stats: ${error.message}`);
        }
    }
}

module.exports = ReservationModel;
