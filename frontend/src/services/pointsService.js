import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper to get auth token
const getAuthToken = () => {
  try {
    const stored = localStorage.getItem('authUser');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.token;
    }
  } catch (e) {
    console.error('Error getting auth token:', e);
  }
  return null;
};

// Helper to create headers with auth token
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Get user's current points balance
 */
export const getUserPoints = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/points`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user points:', error);
    throw error;
  }
};

/**
 * Get points dashboard (points + recent activity)
 */
export const getPointsDashboard = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/points/dashboard`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching points dashboard:', error);
    throw error;
  }
};

/**
 * Get user's points history
 * @param {number} limit - Maximum number of records to return
 */
export const getPointsHistory = async (limit = 50) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/points/history`, {
      params: { limit },
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching points history:', error);
    throw error;
  }
};

/**
 * Add points for photo upload
 * @param {string} stallName - Name of the stall
 * @param {string} dishName - Name of the dish
 * @param {number} photoId - ID of the uploaded photo (optional)
 */
export const addPhotoUploadPoints = async (stallName, dishName, photoId = null) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/points/photo-upload`,
      { stallName, dishName, photoId },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error adding photo upload points:', error);
    throw error;
  }
};

/**
 * Add points for receiving upvote
 * @param {string} stallName - Name of the stall
 * @param {string} dishName - Name of the dish
 * @param {number} reviewId - ID of the review (optional)
 */
export const addUpvotePoints = async (stallName, dishName, reviewId = null) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/points/upvote`,
      { stallName, dishName, reviewId },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error adding upvote points:', error);
    throw error;
  }
};

/**
 * Get all available vouchers
 */
export const getAllVouchers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/vouchers`);
    return response.data;
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    throw error;
  }
};

/**
 * Redeem a voucher
 * @param {number} voucherId - ID of the voucher to redeem
 */
export const redeemVoucher = async (voucherId) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/vouchers/redeem`,
      { voucherId },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error redeeming voucher:', error);
    throw error;
  }
};

/**
 * Get user's redeemed vouchers
 */
export const getRedeemedVouchers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/vouchers/redeemed`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching redeemed vouchers:', error);
    throw error;
  }
};

/**
 * Use/mark a voucher as used
 * @param {string} voucherCode - Unique voucher code
 * @param {number} orderId - ID of the order (optional)
 */
export const useVoucher = async (voucherCode, orderId = null) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/vouchers/use`,
      { voucherCode, orderId },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error using voucher:', error);
    throw error;
  }
};

/**
 * Get voucher by code (for validation)
 * @param {string} voucherCode - Unique voucher code
 */
export const getVoucherByCode = async (voucherCode) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/vouchers/code/${voucherCode}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching voucher by code:', error);
    throw error;
  }
};

/**
 * Get current user's referral code and stats (for viral loop)
 */
export const getReferralInfo = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/referrals/me`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching referral info:', error);
    throw error;
  }
};

export default {
  getUserPoints,
  getPointsDashboard,
  getPointsHistory,
  addPhotoUploadPoints,
  addUpvotePoints,
  getAllVouchers,
  redeemVoucher,
  getRedeemedVouchers,
  useVoucher,
  getVoucherByCode,
  getReferralInfo
};
