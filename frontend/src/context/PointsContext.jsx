import React, { createContext, useState, useEffect, useContext } from 'react';
import * as pointsService from '../services/pointsService';
import { AuthContext } from './AuthContext';

export const PointsContext = createContext();

export const PointsProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [userPoints, setUserPoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [redeemedVouchers, setRedeemedVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user points and history when user logs in
  useEffect(() => {
    if (user) {
      fetchPointsData();
    } else {
      // Reset data when user logs out
      setUserPoints(0);
      setPointsHistory([]);
      setRedeemedVouchers([]);
    }
  }, [user]);

  // Fetch all points data
  const fetchPointsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard data (points + recent history)
      const dashboardData = await pointsService.getPointsDashboard();
      setUserPoints(dashboardData.points || 0);
      
      // Transform history data to match frontend format
      const transformedHistory = dashboardData.recentActivity?.map(item => ({
        id: item.id,
        type: item.transaction_type,
        description: item.description,
        item: item.item_details?.item || '',
        points: item.points,
        date: new Date(item.created_at)
      })) || [];
      setPointsHistory(transformedHistory);

      // Fetch redeemed vouchers
      const vouchersData = await pointsService.getRedeemedVouchers();
      const transformedVouchers = vouchersData.data?.map(v => ({
        id: v.id,
        name: v.name,
        code: v.voucher_code,
        redeemedDate: new Date(v.redeemed_date),
        expiryDate: new Date(v.expiry_date),
        used: v.is_used,
        points: v.points_required,
        value: v.discount_value
      })) || [];
      setRedeemedVouchers(transformedVouchers);
      
    } catch (err) {
      console.error('Error fetching points data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add points for photo upload
  const addPhotoUploadPoints = async (stallName, dishName, photoId = null) => {
    try {
      const result = await pointsService.addPhotoUploadPoints(stallName, dishName, photoId);
      
      if (result.success) {
        // Update local state
        setUserPoints(result.newBalance);
        
        const newActivity = {
          id: result.transaction.id,
          type: 'upload',
          description: 'Photo uploaded',
          item: `${dishName} - ${stallName}`,
          points: result.pointsEarned,
          date: new Date(result.transaction.created_at)
        };
        setPointsHistory(prev => [newActivity, ...prev]);
        
        return result;
      }
    } catch (err) {
      console.error('Error adding photo upload points:', err);
      throw err;
    }
  };

  // Add points for receiving upvote
  const addUpvotePoints = async (stallName, dishName, reviewId = null) => {
    try {
      const result = await pointsService.addUpvotePoints(stallName, dishName, reviewId);
      
      if (result.success) {
        // Update local state
        setUserPoints(result.newBalance);
        
        const newActivity = {
          id: result.transaction.id,
          type: 'upvote',
          description: 'Upvote received',
          item: `${dishName} - ${stallName}`,
          points: result.pointsEarned,
          date: new Date(result.transaction.created_at)
        };
        setPointsHistory(prev => [newActivity, ...prev]);
        
        return result;
      }
    } catch (err) {
      console.error('Error adding upvote points:', err);
      throw err;
    }
  };

  // Redeem voucher
  const redeemVoucher = async (voucher) => {
    try {
      // voucher should have an id property
      const voucherId = voucher.id;
      
      if (!voucherId) {
        console.error('Voucher ID is required');
        return { success: false, message: 'Invalid voucher' };
      }

      const result = await pointsService.redeemVoucher(voucherId);
      
      if (result.success) {
        // Update local state
        setUserPoints(result.newBalance);
        
        const redeemedVoucher = {
          id: result.voucher.id,
          name: result.voucher.name,
          code: result.voucher.code,
          redeemedDate: new Date(result.voucher.redeemed_date),
          expiryDate: new Date(result.voucher.expiry_date),
          used: result.voucher.used,
          points: result.voucher.points_required,
          value: result.voucher.discount_value
        };
        
        setRedeemedVouchers(prev => [redeemedVoucher, ...prev]);
        
        return { success: true, voucher: redeemedVoucher };
      }
      
      return result;
    } catch (err) {
      console.error('Error redeeming voucher:', err);
      const errorMessage = err.response?.data?.message || err.message;
      return { success: false, message: errorMessage };
    }
  };

  // Use voucher
  const useVoucher = async (voucherCode, orderId = null) => {
    try {
      const result = await pointsService.useVoucher(voucherCode, orderId);
      
      if (result.success) {
        // Update local state
        setRedeemedVouchers(prev => 
          prev.map(v => v.code === voucherCode ? { ...v, used: true } : v)
        );
      }
      
      return result;
    } catch (err) {
      console.error('Error using voucher:', err);
      throw err;
    }
  };

  // Refresh points data
  const refreshPoints = async () => {
    await fetchPointsData();
  };

  const value = {
    userPoints,
    pointsHistory,
    redeemedVouchers,
    loading,
    error,
    addPhotoUploadPoints,
    addUpvotePoints,
    redeemVoucher,
    useVoucher,
    refreshPoints,
    fetchPointsData
  };

  return (
    <PointsContext.Provider value={value}>
      {children}
    </PointsContext.Provider>
  );
};
