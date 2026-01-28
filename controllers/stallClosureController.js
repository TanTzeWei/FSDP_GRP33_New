const StallClosureModel = require('../models/stallClosureModel');
const StallModel = require('../models/stallModel');

class StallClosureController {
    /**
     * Create a new stall closure
     * POST /api/stalls/:id/closures
     */
    static async createClosure(req, res) {
        try {
            const { id: stallId } = req.params;
            const userId = req.user?.id;
            const userStallId = req.user?.stall_id || req.user?.stallId;

            // Validate stall ID
            if (!stallId || isNaN(stallId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Valid stall ID is required' 
                });
            }

            const parsedStallId = parseInt(stallId);

            // Verify the user owns this stall
            if (userStallId !== parsedStallId) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You can only manage closures for your own stall' 
                });
            }

            // Validate required fields
            const { closure_type, start_date, end_date, is_recurring, recurrence_pattern, reason } = req.body;

            if (!closure_type || !start_date || !end_date) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Closure type, start date, and end date are required' 
                });
            }

            // Validate closure type
            const validTypes = ['off_day', 'maintenance', 'public_holiday', 'custom', 'emergency'];
            if (!validTypes.includes(closure_type)) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Invalid closure type. Must be one of: ${validTypes.join(', ')}` 
                });
            }

            // Validate dates
            const startDate = new Date(start_date);
            const endDate = new Date(end_date);
            
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid date format' 
                });
            }

            if (endDate <= startDate) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'End date must be after start date' 
                });
            }

            // Create the closure
            const closure = await StallClosureModel.createClosure({
                stall_id: parsedStallId,
                closure_type,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                is_recurring: is_recurring || false,
                recurrence_pattern: recurrence_pattern || null,
                reason: reason || null,
                created_by: userId
            });

            res.status(201).json({ 
                success: true, 
                message: 'Closure created successfully', 
                data: closure 
            });
        } catch (error) {
            console.error('Error in createClosure:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to create closure', 
                error: error.message 
            });
        }
    }

    /**
     * Get all closures for a stall
     * GET /api/stalls/:id/closures
     */
    static async getStallClosures(req, res) {
        try {
            const { id: stallId } = req.params;
            const { active_only, upcoming_only } = req.query;
            
            console.log('=== GET STALL CLOSURES ===');
            console.log('Stall ID:', stallId);
            console.log('User:', req.user);

            if (!stallId || isNaN(stallId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Valid stall ID is required' 
                });
            }

            const parsedStallId = parseInt(stallId);
            let closures;

            if (upcoming_only === 'true') {
                closures = await StallClosureModel.getUpcomingClosures(parsedStallId);
            } else {
                const activeOnly = active_only !== 'false'; // Default to true
                closures = await StallClosureModel.getStallClosures(parsedStallId, activeOnly);
            }

            res.status(200).json({ 
                success: true, 
                data: closures 
            });
        } catch (error) {
            console.error('Error in getStallClosures:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch closures', 
                error: error.message 
            });
        }
    }

    /**
     * Get stall closure status
     * GET /api/stalls/:id/closure-status
     */
    static async getClosureStatus(req, res) {
        try {
            const { id: stallId } = req.params;

            if (!stallId || isNaN(stallId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Valid stall ID is required' 
                });
            }

            const parsedStallId = parseInt(stallId);
            const status = await StallClosureModel.isStallClosed(parsedStallId);

            res.status(200).json({ 
                success: true, 
                data: status 
            });
        } catch (error) {
            console.error('Error in getClosureStatus:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to check closure status', 
                error: error.message 
            });
        }
    }

    /**
     * Update a stall closure
     * PUT /api/stalls/:id/closures/:closureId
     */
    static async updateClosure(req, res) {
        try {
            const { id: stallId, closureId } = req.params;
            const userId = req.user?.id;
            const userStallId = req.user?.stall_id || req.user?.stallId;

            // Validate IDs
            if (!stallId || isNaN(stallId) || !closureId || isNaN(closureId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Valid stall ID and closure ID are required' 
                });
            }

            const parsedStallId = parseInt(stallId);

            // Verify the user owns this stall
            if (userStallId !== parsedStallId) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You can only manage closures for your own stall' 
                });
            }

            // Get the existing closure to verify it belongs to this stall
            const existingClosure = await StallClosureModel.getClosureById(parseInt(closureId));
            if (!existingClosure) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Closure not found' 
                });
            }

            if (existingClosure.stall_id !== parsedStallId) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'This closure does not belong to your stall' 
                });
            }

            // Validate dates if provided
            const { start_date, end_date } = req.body;
            if (start_date && end_date) {
                const startDate = new Date(start_date);
                const endDate = new Date(end_date);
                
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Invalid date format' 
                    });
                }

                if (endDate <= startDate) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'End date must be after start date' 
                    });
                }

                req.body.start_date = startDate.toISOString();
                req.body.end_date = endDate.toISOString();
            }

            // Update the closure
            const updatedClosure = await StallClosureModel.updateClosure(
                parseInt(closureId), 
                req.body
            );

            res.status(200).json({ 
                success: true, 
                message: 'Closure updated successfully', 
                data: updatedClosure 
            });
        } catch (error) {
            console.error('Error in updateClosure:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update closure', 
                error: error.message 
            });
        }
    }

    /**
     * Delete a stall closure
     * DELETE /api/stalls/:id/closures/:closureId
     */
    static async deleteClosure(req, res) {
        try {
            const { id: stallId, closureId } = req.params;
            const userId = req.user?.id;
            const userStallId = req.user?.stall_id || req.user?.stallId;

            // Validate IDs
            if (!stallId || isNaN(stallId) || !closureId || isNaN(closureId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Valid stall ID and closure ID are required' 
                });
            }

            const parsedStallId = parseInt(stallId);

            // Verify the user owns this stall
            if (userStallId !== parsedStallId) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You can only manage closures for your own stall' 
                });
            }

            // Get the existing closure to verify it belongs to this stall
            const existingClosure = await StallClosureModel.getClosureById(parseInt(closureId));
            if (!existingClosure) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Closure not found' 
                });
            }

            if (existingClosure.stall_id !== parsedStallId) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'This closure does not belong to your stall' 
                });
            }

            // Delete the closure
            await StallClosureModel.deleteClosure(parseInt(closureId));

            res.status(200).json({ 
                success: true, 
                message: 'Closure deleted successfully' 
            });
        } catch (error) {
            console.error('Error in deleteClosure:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to delete closure', 
                error: error.message 
            });
        }
    }

    /**
     * Get active closures for a stall
     * GET /api/stalls/:id/active-closures
     */
    static async getActiveClosures(req, res) {
        try {
            const { id: stallId } = req.params;

            if (!stallId || isNaN(stallId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Valid stall ID is required' 
                });
            }

            const parsedStallId = parseInt(stallId);
            const activeClosures = await StallClosureModel.getActiveClosures(parsedStallId);

            res.status(200).json({ 
                success: true, 
                data: activeClosures 
            });
        } catch (error) {
            console.error('Error in getActiveClosures:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch active closures', 
                error: error.message 
            });
        }
    }
}

module.exports = StallClosureController;
