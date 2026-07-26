import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from './PaymentForm';
import API from '../api/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function PaymentModal({ bid, project, onClose, onSuccess }) {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initializePayment = async () => {
      try {
        const response = await API.post('/payments/create-payment-intent', {
          bid_id: bid.id,
          amount: bid.amount,
          project_id: project.id,
          investor_id: bid.investor_id,
          student_id: project.user_id
        });

        setClientSecret(response.data.clientSecret);
      } catch (error) {
        console.error('Payment initialization error:', error);
        setError('Failed to initialize payment. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (bid && project) {
      initializePayment();
    }
  }, [bid, project]);

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Initializing Payment...</h3>
          <p>Please wait while we set up your payment.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Payment Error</h3>
          <p>{error}</p>
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3>Secure Payment</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="modal-body">
          {clientSecret && (
            <Elements 
              stripe={stripePromise} 
              options={{ clientSecret }}
            >
              <PaymentForm 
                bid={bid}
                project={project}
                onSuccess={onSuccess}
                onCancel={onClose}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}