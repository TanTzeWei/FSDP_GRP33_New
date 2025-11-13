import React, { createContext, useState, useEffect } from 'react';

export const PointsContext = createContext();

export const PointsProvider = ({ children }) => {
  const [userPoints, setUserPoints] = useState(125);
  const [pointsHistory, setPointsHistory] = useState([
    { id: 1, type: 'upload', description: 'Photo uploaded', item: 'Chicken Rice - Stall 23', points: 10, date: new Date() },
    { id: 2, type: 'upvote', description: 'Upvote received', item: 'Laksa - Stall 15', points: 5, date: new Date() },
    { id: 3, type: 'upvote', description: 'Upvote received', item: 'Char Kway Teow - Stall 8', points: 5, date: new Date() }
  ]);
  const [redeemedVouchers, setRedeemedVouchers] = useState([]);

  // Add points for photo upload
  const addPhotoUploadPoints = (stallName, dishName) => {
    const newActivity = {
      id: Date.now(),
      type: 'upload',
      description: 'Photo uploaded',
      item: `${dishName} - ${stallName}`,
      points: 10,
      date: new Date()
    };
    setPointsHistory(prev => [newActivity, ...prev]);
    setUserPoints(prev => prev + 10);
  };

  // Add points for receiving upvote
  const addUpvotePoints = (stallName, dishName) => {
    const newActivity = {
      id: Date.now(),
      type: 'upvote',
      description: 'Upvote received',
      item: `${dishName} - ${stallName}`,
      points: 5,
      date: new Date()
    };
    setPointsHistory(prev => [newActivity, ...prev]);
    setUserPoints(prev => prev + 5);
  };

  // Redeem voucher
  const redeemVoucher = (voucher) => {
    if (userPoints >= voucher.points) {
      const voucherCode = 'HWK' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const redeemedVoucher = {
        ...voucher,
        code: voucherCode,
        redeemedDate: new Date(),
        expiryDate: expiryDate,
        used: false
      };

      setRedeemedVouchers(prev => [redeemedVoucher, ...prev]);
      setUserPoints(prev => prev - voucher.points);
      
      return { success: true, voucher: redeemedVoucher };
    }
    return { success: false, message: 'Not enough points' };
  };

  // Use voucher
  const useVoucher = (voucherCode) => {
    setRedeemedVouchers(prev => 
      prev.map(v => v.code === voucherCode ? { ...v, used: true } : v)
    );
  };

  const value = {
    userPoints,
    pointsHistory,
    redeemedVouchers,
    addPhotoUploadPoints,
    addUpvotePoints,
    redeemVoucher,
    useVoucher
  };

  return (
    <PointsContext.Provider value={value}>
      {children}
    </PointsContext.Provider>
  );
};
