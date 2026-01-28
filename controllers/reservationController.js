const ReservationModel = require('../models/reservationModel');

class ReservationController {
    /**
     * Create a new reservation
     * POST /api/reservations
     */
    static async createReservation(req, res) {
        try {
            const userId = req.user.id; // From auth middleware
            const { hawkerCentreId, tableId, tableNumber, reservationDate, reservationTime, partySize, specialRequests, contactPhone } = req.body;

            // Validate required fields
            if (!hawkerCentreId || !tableId || !tableNumber || !reservationDate || !reservationTime || !partySize) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Validate date is not in the past
            const reservationDateTime = new Date(`${reservationDate}T${reservationTime}`);
            if (reservationDateTime < new Date()) {
                return res.status(400).json({ error: 'Reservation date and time must be in the future' });
            }

            // Check if table is available
            const isAvailable = await ReservationModel.isTableAvailable(tableId, reservationDate, reservationTime);
            if (!isAvailable) {
                return res.status(409).json({ error: 'Table is not available at the requested time' });
            }

            // Create reservation
            const reservation = await ReservationModel.createReservation(
                userId,
                hawkerCentreId,
                tableId,
                tableNumber,
                reservationDate,
                reservationTime,
                partySize,
                specialRequests,
                contactPhone
            );

            res.status(201).json({
                success: true,
                message: 'Reservation created successfully',
                data: reservation
            });
        } catch (error) {
            console.error('Error creating reservation:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get user's reservations
     * GET /api/reservations
     */
    static async getUserReservations(req, res) {
        try {
            const userId = req.user.id;
            const reservations = await ReservationModel.getUserReservations(userId);

            res.json({
                success: true,
                count: reservations.length,
                data: reservations
            });
        } catch (error) {
            console.error('Error fetching user reservations:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get reservation details
     * GET /api/reservations/:id
     */
    static async getReservation(req, res) {
        try {
            const { id } = req.params;
            const reservation = await ReservationModel.getReservationById(id);

            if (!reservation) {
                return res.status(404).json({ error: 'Reservation not found' });
            }

            // Check if user owns this reservation or is admin
            if (reservation.user_id !== req.user.id && !req.user.isAdmin) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            res.json({
                success: true,
                data: reservation
            });
        } catch (error) {
            console.error('Error fetching reservation:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get available tables for a specific hawker centre and time
     * GET /api/reservations/available-tables
     */
    static async getAvailableTables(req, res) {
        try {
            const { hawkerCentreId, reservationDate, reservationTime, duration } = req.query;

            if (!hawkerCentreId || !reservationDate || !reservationTime) {
                return res.status(400).json({ error: 'Missing required parameters: hawkerCentreId, reservationDate, reservationTime' });
            }

            const availableTables = await ReservationModel.getAvailableTables(
                hawkerCentreId,
                reservationDate,
                reservationTime,
                duration ? parseInt(duration) : 120
            );

            res.json({
                success: true,
                count: availableTables.length,
                data: availableTables
            });
        } catch (error) {
            console.error('Error fetching available tables:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get all tables for a hawker centre
     * GET /api/hawker-centres/:hawkerCentreId/tables
     */
    static async getHawkerCentreTables(req, res) {
        try {
            const { hawkerCentreId } = req.params;
            const tables = await ReservationModel.getHawkerCentreTables(hawkerCentreId);

            res.json({
                success: true,
                count: tables.length,
                data: tables
            });
        } catch (error) {
            console.error('Error fetching hawker centre tables:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Update reservation
     * PUT /api/reservations/:id
     */
    static async updateReservation(req, res) {
        try {
            const { id } = req.params;
            const { status, specialRequests, contactPhone } = req.body;

            // Check if user owns this reservation or is admin
            const reservation = await ReservationModel.getReservationById(id);
            if (!reservation) {
                return res.status(404).json({ error: 'Reservation not found' });
            }

            if (reservation.user_id !== req.user.id && !req.user.isAdmin) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            // Prepare updates
            const updates = {};
            if (status) updates.status = status;
            if (specialRequests) updates.special_requests = specialRequests;
            if (contactPhone) updates.contact_phone = contactPhone;

            const updatedReservation = await ReservationModel.updateReservation(id, updates);

            res.json({
                success: true,
                message: 'Reservation updated successfully',
                data: updatedReservation
            });
        } catch (error) {
            console.error('Error updating reservation:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Cancel reservation
     * DELETE /api/reservations/:id
     */
    static async cancelReservation(req, res) {
        try {
            const { id } = req.params;

            // Check if user owns this reservation or is admin
            const reservation = await ReservationModel.getReservationById(id);
            if (!reservation) {
                return res.status(404).json({ error: 'Reservation not found' });
            }

            if (reservation.user_id !== req.user.id && !req.user.isAdmin) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            // Can't cancel if already completed or cancelled
            if (['Completed', 'Cancelled'].includes(reservation.status)) {
                return res.status(400).json({ error: `Cannot cancel a ${reservation.status.toLowerCase()} reservation` });
            }

            const cancelled = await ReservationModel.cancelReservation(id);

            res.json({
                success: true,
                message: 'Reservation cancelled successfully',
                data: cancelled
            });
        } catch (error) {
            console.error('Error cancelling reservation:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Add item to reservation (for pre-ordering)
     * POST /api/reservations/:id/items
     */
    static async addReservationItem(req, res) {
        try {
            const { id } = req.params;
            const { stallId, foodItemId, quantity, notes } = req.body;

            if (!stallId) {
                return res.status(400).json({ error: 'Stall ID is required' });
            }

            // Verify reservation exists and user owns it
            const reservation = await ReservationModel.getReservationById(id);
            if (!reservation) {
                return res.status(404).json({ error: 'Reservation not found' });
            }

            if (reservation.user_id !== req.user.id && !req.user.isAdmin) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            const item = await ReservationModel.addReservationItem(
                id,
                stallId,
                foodItemId,
                quantity || 1,
                notes
            );

            res.status(201).json({
                success: true,
                message: 'Item added to reservation',
                data: item
            });
        } catch (error) {
            console.error('Error adding reservation item:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get reservation items
     * GET /api/reservations/:id/items
     */
    static async getReservationItems(req, res) {
        try {
            const { id } = req.params;

            // Verify reservation exists and user owns it
            const reservation = await ReservationModel.getReservationById(id);
            if (!reservation) {
                return res.status(404).json({ error: 'Reservation not found' });
            }

            if (reservation.user_id !== req.user.id && !req.user.isAdmin) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            const items = await ReservationModel.getReservationItems(id);

            res.json({
                success: true,
                count: items.length,
                data: items
            });
        } catch (error) {
            console.error('Error fetching reservation items:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Delete reservation item
     * DELETE /api/reservations/:id/items/:itemId
     */
    static async deleteReservationItem(req, res) {
        try {
            const { id, itemId } = req.params;

            // Verify reservation exists and user owns it
            const reservation = await ReservationModel.getReservationById(id);
            if (!reservation) {
                return res.status(404).json({ error: 'Reservation not found' });
            }

            if (reservation.user_id !== req.user.id && !req.user.isAdmin) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            await ReservationModel.deleteReservationItem(itemId);

            res.json({
                success: true,
                message: 'Item removed from reservation'
            });
        } catch (error) {
            console.error('Error deleting reservation item:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get hawker centre reservations (for stall owners/admin)
     * GET /api/hawker-centres/:hawkerCentreId/reservations
     */
    static async getHawkerCentreReservations(req, res) {
        try {
            const { hawkerCentreId } = req.params;
            const { fromDate, toDate } = req.query;

            // Note: Add authorization check for stall owners of this hawker centre if needed
            const reservations = await ReservationModel.getHawkerCentreReservations(
                hawkerCentreId,
                fromDate,
                toDate
            );

            res.json({
                success: true,
                count: reservations.length,
                data: reservations
            });
        } catch (error) {
            console.error('Error fetching hawker centre reservations:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get reservation statistics for a hawker centre
     * GET /api/hawker-centres/:hawkerCentreId/reservation-stats
     */
    static async getHawkerCentreReservationStats(req, res) {
        try {
            const { hawkerCentreId } = req.params;
            const { days } = req.query;

            const stats = await ReservationModel.getHawkerCentreReservationStats(
                hawkerCentreId,
                days ? parseInt(days) : 30
            );

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error fetching reservation statistics:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = ReservationController;
