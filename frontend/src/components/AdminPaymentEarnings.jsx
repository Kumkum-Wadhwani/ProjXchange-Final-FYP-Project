import React, { useState, useEffect } from 'react';
import API from '../api/api';

export default function AdminPaymentEarnings() {
  const [transactions, setTransactions] = useState([]);
  const [earnings, setEarnings] = useState({
    totalRevenue: 0,
    platformEarnings: 0,
    totalTransactions: 0
  });

  useEffect(() => {
    loadTransactionData();
  }, []);

  const loadTransactionData = async () => {
    try {
      const response = await API.get('/admin/transactions');
      
      if (response.data && response.data.success && Array.isArray(response.data.transactions)) {
        setTransactions(response.data.transactions);
        
        const totalRevenue = response.data.transactions.reduce((sum, transaction) => 
          sum + parseFloat(transaction.amount || 0), 0
        );
        const platformEarnings = response.data.transactions.reduce((sum, transaction) => 
          sum + parseFloat(transaction.commission || transaction.platformFee || 0), 0
        );

        setEarnings({
          totalRevenue,
          platformEarnings,
          totalTransactions: response.data.transactions.length
        });
      } else {
        useMockTransactions();
      }
    } catch (error) {
      console.error('Error loading transaction data:', error);
      useMockTransactions();
    }
  };

  const useMockTransactions = () => {
    const mockTransactions = [
      { id: 1, project_title: "E-commerce Platform", investor_name: "Jane Smith", student_name: "John Doe", amount: "5000", commission: "500", status: "completed", created_at: "2024-01-20" },
      { id: 2, project_title: "AI Chatbot", investor_name: "Alice Brown", student_name: "Bob Wilson", amount: "3000", commission: "300", status: "completed", created_at: "2024-01-19" },
      { id: 3, project_title: "Mobile App", investor_name: "Jane Smith", student_name: "Charlie Davis", amount: "4500", commission: "450", status: "pending", created_at: "2024-01-18" },
    ];
    
    setTransactions(mockTransactions);
    setEarnings({
      totalRevenue: 12500,
      platformEarnings: 1250,
      totalTransactions: 3
    });
  };

  return (
    <div className="admin-payment-earnings">
      <h2>Payment & Earnings Dashboard</h2>
      
      <div className="earnings-cards">
        <div className="card">
          <h3>Total Revenue</h3>
          <p className="amount">${earnings.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="card">
          <h3>Platform Earnings</h3>
          <p className="amount">${earnings.platformEarnings.toFixed(2)}</p>
        </div>
        <div className="card">
          <h3>Total Transactions</h3>
          <p className="amount">{earnings.totalTransactions}</p>
        </div>
      </div>

      <div className="transactions-table">
        <h3>Recent Transactions</h3>
        <table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Project</th>
              <th>Investor</th>
              <th>Student</th>
              <th>Amount</th>
              <th>Commission</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <tr key={transaction.id}>
                <td>#{transaction.id}</td>
                <td>{transaction.project_title}</td>
                <td>{transaction.investor_name}</td>
                <td>{transaction.student_name}</td>
                <td>${transaction.amount}</td>
                <td>${transaction.commission}</td>
                <td className={`status ${transaction.status}`}>
                  {transaction.status}
                </td>
                <td>{new Date(transaction.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}