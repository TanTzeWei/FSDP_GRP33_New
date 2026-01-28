const supabase = require('../dbConfig');

class StallClosureModel {
    /**
     * Create a new stall closure
     * @param {Object} closureData - Closure information
     * @returns {Object} Created closure
     */
    static async createClosure(closureData) {
        try {
            const {
                stall_id,
                closure_type,
                start_date,
                end_date,
                is_recurring = false,
                recurrence_pattern = null,
                reason = null,
                created_by
            } = closureData;

            const { data, error } = await supabase
                .from('stall_closures')
                .insert({
                    stall_id,
                    closure_type,
                    start_date,
                    end_date,
                    is_recurring,
                    recurrence_pattern: recurrence_pattern ? JSON.stringify(recurrence_pattern) : null,
                    reason,
                    created_by,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error creating stall closure: ${error.message}`);
        }
    }

    /**
     * Get all closures for a specific stall
     * @param {number} stallId - The stall ID
     * @param {boolean} activeOnly - Whether to return only active closures
     * @returns {Array} List of closures
     */
    static async getStallClosures(stallId, activeOnly = true) {
        try {
            let query = supabase
                .from('stall_closures')
                .select('*')
                .eq('stall_id', stallId)
                .order('start_date', { ascending: false });

            if (activeOnly) {
                query = query.eq('is_active', true);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Parse recurrence_pattern JSON
            return (data || []).map(closure => ({
                ...closure,
                recurrence_pattern: closure.recurrence_pattern 
                    ? JSON.parse(closure.recurrence_pattern) 
                    : null
            }));
        } catch (error) {
            throw new Error(`Error fetching stall closures: ${error.message}`);
        }
    }

    /**
     * Get a specific closure by ID
     * @param {number} closureId - The closure ID
     * @returns {Object|null} Closure data
     */
    static async getClosureById(closureId) {
        try {
            const { data, error } = await supabase
                .from('stall_closures')
                .select('*')
                .eq('id', closureId)
                .single();

            if (error) throw error;

            if (data && data.recurrence_pattern) {
                data.recurrence_pattern = JSON.parse(data.recurrence_pattern);
            }

            return data;
        } catch (error) {
            throw new Error(`Error fetching closure: ${error.message}`);
        }
    }

    /**
     * Update a stall closure
     * @param {number} closureId - The closure ID
     * @param {Object} updateData - Data to update
     * @returns {Object} Updated closure
     */
    static async updateClosure(closureId, updateData) {
        try {
            // Prepare update object
            const updates = {
                ...updateData,
                updated_at: new Date().toISOString()
            };

            // Stringify recurrence_pattern if provided
            if (updates.recurrence_pattern) {
                updates.recurrence_pattern = JSON.stringify(updates.recurrence_pattern);
            }

            const { data, error } = await supabase
                .from('stall_closures')
                .update(updates)
                .eq('id', closureId)
                .select()
                .single();

            if (error) throw error;

            if (data && data.recurrence_pattern) {
                data.recurrence_pattern = JSON.parse(data.recurrence_pattern);
            }

            return data;
        } catch (error) {
            throw new Error(`Error updating closure: ${error.message}`);
        }
    }

    /**
     * Delete (soft delete) a stall closure
     * @param {number} closureId - The closure ID
     * @returns {boolean} Success status
     */
    static async deleteClosure(closureId) {
        try {
            const { error } = await supabase
                .from('stall_closures')
                .update({ 
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', closureId);

            if (error) throw error;
            return true;
        } catch (error) {
            throw new Error(`Error deleting closure: ${error.message}`);
        }
    }

    /**
     * Check if a stall is currently closed
     * @param {number} stallId - The stall ID
     * @param {Date} checkDate - Date to check (defaults to now)
     * @returns {Object} { isClosed: boolean, closureInfo: Object|null }
     */
    static async isStallClosed(stallId, checkDate = new Date()) {
        try {
            const currentTime = checkDate.toISOString();

            // Get active closures that overlap with current time
            const { data, error } = await supabase
                .from('stall_closures')
                .select('*')
                .eq('stall_id', stallId)
                .eq('is_active', true)
                .lte('start_date', currentTime)
                .gte('end_date', currentTime)
                .order('closure_type', { ascending: true }); // Priority: emergency, custom, etc.

            if (error) throw error;

            if (data && data.length > 0) {
                // Check for recurring closures
                const activeClosures = data.filter(closure => {
                    if (!closure.is_recurring) return true;

                    // Check if current day matches recurring pattern
                    if (closure.recurrence_pattern) {
                        try {
                            const pattern = JSON.parse(closure.recurrence_pattern);
                            const currentDay = checkDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

                            if (pattern.day_of_week !== undefined && pattern.day_of_week === currentDay) {
                                return true;
                            }
                        } catch (e) {
                            console.error('Error parsing recurrence pattern:', e);
                        }
                    }
                    return false;
                });

                if (activeClosures.length > 0) {
                    const closureInfo = activeClosures[0];
                    if (closureInfo.recurrence_pattern) {
                        closureInfo.recurrence_pattern = JSON.parse(closureInfo.recurrence_pattern);
                    }

                    return {
                        isClosed: true,
                        closureInfo
                    };
                }
            }

            return {
                isClosed: false,
                closureInfo: null
            };
        } catch (error) {
            throw new Error(`Error checking stall closure status: ${error.message}`);
        }
    }

    /**
     * Get upcoming closures for a stall
     * @param {number} stallId - The stall ID
     * @param {number} daysAhead - Number of days to look ahead (default 30)
     * @returns {Array} List of upcoming closures
     */
    static async getUpcomingClosures(stallId, daysAhead = 30) {
        try {
            const now = new Date();
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + daysAhead);

            const { data, error } = await supabase
                .from('stall_closures')
                .select('*')
                .eq('stall_id', stallId)
                .eq('is_active', true)
                .gte('end_date', now.toISOString())
                .lte('start_date', futureDate.toISOString())
                .order('start_date', { ascending: true });

            if (error) throw error;

            return (data || []).map(closure => ({
                ...closure,
                recurrence_pattern: closure.recurrence_pattern 
                    ? JSON.parse(closure.recurrence_pattern) 
                    : null
            }));
        } catch (error) {
            throw new Error(`Error fetching upcoming closures: ${error.message}`);
        }
    }

    /**
     * Get active closures (currently in effect)
     * @param {number} stallId - The stall ID
     * @returns {Array} List of active closures
     */
    static async getActiveClosures(stallId) {
        try {
            const now = new Date().toISOString();

            const { data, error } = await supabase
                .from('stall_closures')
                .select('*')
                .eq('stall_id', stallId)
                .eq('is_active', true)
                .lte('start_date', now)
                .gte('end_date', now)
                .order('closure_type', { ascending: true });

            if (error) throw error;

            return (data || []).map(closure => ({
                ...closure,
                recurrence_pattern: closure.recurrence_pattern 
                    ? JSON.parse(closure.recurrence_pattern) 
                    : null
            }));
        } catch (error) {
            throw new Error(`Error fetching active closures: ${error.message}`);
        }
    }
}

module.exports = StallClosureModel;
