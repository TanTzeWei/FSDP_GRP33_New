import { Component } from "react";
import { useNavigate } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import Button from '@mui/material/Button';
import { CartContext } from '../context/CartContext';
import { PointsContext } from '../context/PointsContext';
import txnSuccess from '../assets/greenTick.png';

class TxnNetsSuccessStatus extends Component {
    render() {
        const { onBackToHome } = this.props;
        
        return (
            <div style={{ margin: '50px' }}>
                <div className="netsQrPaymentGatewayWebpage" style={{ marginTop: '20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                    <div className="netsQrTxnSuccessStatus" style={{ marginTop: '20px' }}>
                        <img src={txnSuccess} height="auto" width="30%" alt="Transaction Success" />
                        <h2 className="text" style={{ fontSize: '18px' }}>TRANSACTION COMPLETED</h2>
                        <div className="button" id="btnSuccess" style={{ marginTop: '20px' }}>
                            <Button 
                                variant="contained" 
                                sx={{ width: 300 }} 
                                style={{ 
                                    backgroundColor: "dodgerblue", 
                                    borderRadius: '10px', 
                                    fontSize: '14px', 
                                    textDecoration: 'none', 
                                    height: "50px" 
                                }} 
                                onClick={onBackToHome}
                            >
                                Back to Home
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

// Wrapper to use hooks with class component
function TxnNetsSuccessStatusLayout() {
  const navigate = useNavigate();
  const { clearCart } = useContext(CartContext);
  const { useVoucher } = useContext(PointsContext);

  useEffect(() => {
    // Clear cart when user arrives at success page
    clearCart();

    // Mark voucher as used if one was selected
    const markVoucherAsUsed = async () => {
      const voucherCode = localStorage.getItem('selectedVoucherCode');
      if (voucherCode) {
        try {
          await useVoucher(voucherCode);
          console.log('Voucher marked as used:', voucherCode);
          // Clear the voucher code from localStorage
          localStorage.removeItem('selectedVoucherCode');
        } catch (error) {
          console.error('Error marking voucher as used:', error);
        }
      }
    };

    markVoucherAsUsed();
  }, [clearCart, useVoucher]);

  const handleBackToHome = () => {
    navigate('/');
  };

  return <TxnNetsSuccessStatus onBackToHome={handleBackToHome} />;
}

export default TxnNetsSuccessStatusLayout;