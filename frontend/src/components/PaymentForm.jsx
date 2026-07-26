import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import API from '../api/api';

export default function PaymentForm({ bid, project, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required'
      });

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Notify backend of successful payment
        const response = await API.post('/payments/payment-success', {
          paymentIntentId: paymentIntent.id,
          bid_id: bid.id
        });

        if (response.data.success) {
          onSuccess(response.data.message);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-form-container">
      <h3>Fund Project: {project?.title}</h3>
      <p><strong>Amount:</strong> ${bid?.amount}</p>
      
      <form onSubmit={handleSubmit} className="payment-form">
        <PaymentElement />
        
        {error && (
          <div className="error-message" style={{ color: 'red', margin: '10px 0' }}>
            {error}
          </div>
        )}
        
        <div className="payment-actions" style={{ marginTop: '20px' }}>
          <button 
            type="button" 
            onClick={onCancel}
            disabled={loading}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={!stripe || loading}
            className="btn btn-primary"
          >
            {loading ? 'Processing...' : `Pay $${bid?.amount}`}
          </button>
        </div>
      </form>
    </div>
  );
}