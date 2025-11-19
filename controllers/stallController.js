const StallModel = require('../models/stallModel');

class StallController {
    static async getStallById(req, res) {
        try {
            const { id } = req.params;
            if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Valid stall ID is required' });

            const stall = await StallModel.getStallById(parseInt(id));
            if (!stall) return res.status(404).json({ success: false, message: 'Stall not found' });

            // parse specialties JSON if present
            try {
                stall.specialties = stall.specialties ? JSON.parse(stall.specialties) : [];
            } catch (e) {
                stall.specialties = [];
            }

            res.status(200).json({ success: true, data: stall });
        } catch (error) {
            console.error('Error in getStallById:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch stall', error: error.message });
        }
    }
}

module.exports = StallController;
