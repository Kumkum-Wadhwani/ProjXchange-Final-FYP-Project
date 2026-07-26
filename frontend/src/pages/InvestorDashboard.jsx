import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function InvestorDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ totalBids: 0, projectsFunded: 0, totalInvested: 0, pendingPayments: 0 });
  const [projects, setProjects] = useState([]);
  const [bids, setBids] = useState([]);
  const [bidCredits, setBidCredits] = useState({ freeBids: 0, paidBids: 0, totalBids: 0 });
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewingProject, setViewingProject] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [bidPacks, setBidPacks] = useState([]);
  const [viewingBid, setViewingBid] = useState(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '', company: '', investmentPreference: '', bio: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [showBidPaymentModal, setShowBidPaymentModal] = useState(false);
  const [payingBid, setPayingBid] = useState(null);
  const [bidPaymentClientSecret, setBidPaymentClientSecret] = useState('');
  const [bidPaymentProcessing, setBidPaymentProcessing] = useState(false);
  const [paymentCardElement, setPaymentCardElement] = useState(null);
  const [paymentStripe, setPaymentStripe] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const [pendingAccessBid, setPendingAccessBid] = useState(null);
  const [trackedViews, setTrackedViews] = useState(new Set());
  const [popup, setPopup] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, bidId: null, message: '' });
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const cardElementRef = useRef(null);
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);
  const [showInvestorDeliverablesModal, setShowInvestorDeliverablesModal] = useState(false);
  const [selectedBidForInvestorFiles, setSelectedBidForInvestorFiles] = useState(null);
  const [investorDeliverables, setInvestorDeliverables] = useState([]);
  const [deliverablesLoading, setDeliverablesLoading] = useState(false);
  const observerRef = useRef(null);
  const projectCardRefs = useRef({});
  const navigate = useNavigate();

  useEffect(() => {
    if (popup.show) {
      const timer = setTimeout(() => setPopup({ show: false, message: '', type: 'success' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [popup.show]);

  const showPopup = (message, type = 'success') => setPopup({ show: true, message, type });

  const loadUserProfile = async () => {
    try {
      const response = await API.get('/auth/profile');
      if (response.data.success) {
        setProfileForm({
          name: response.data.user.name || '',
          phone: response.data.user.phone || '',
          company: response.data.user.company || '',
          investmentPreference: response.data.user.investment_preference || '',
          bio: response.data.user.bio || ''
        });
      }
    } catch (error) { console.error('Error loading profile:', error); }
  };

  const handleUpdateProfile = async () => {
    setProfileLoading(true);
    try {
      const updateData = { name: profileForm.name, phone: profileForm.phone, company: profileForm.company, investment_preference: profileForm.investmentPreference, bio: profileForm.bio };
      if (passwordForm.newPassword) {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) { showPopup('New passwords do not match', 'error'); setProfileLoading(false); return; }
        if (passwordForm.newPassword.length < 6) { showPopup('Password must be at least 6 characters', 'error'); setProfileLoading(false); return; }
        if (!passwordForm.currentPassword) { showPopup('Please enter current password to change password', 'error'); setProfileLoading(false); return; }
        updateData.currentPassword = passwordForm.currentPassword;
        updateData.newPassword = passwordForm.newPassword;
      }
      const response = await API.put('/auth/profile', updateData);
      if (response.data.success) {
        showPopup('Profile updated successfully!', 'success');
        const updatedUser = { ...user, name: profileForm.name };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        window.dispatchEvent(new Event('storage'));
      } else { showPopup(response.data.message || 'Failed to update profile', 'error'); }
    } catch (error) { showPopup(error.response?.data?.message || 'Error updating profile', 'error'); }
    finally { setProfileLoading(false); }
  };

  const resetProfileForm = () => {
    setProfileForm({ name: user?.name || '', phone: user?.phone || '', company: '', investmentPreference: '', bio: '' });
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    showPopup('Form reset', 'success');
  };

  const trackProjectView = async (projectId) => {
    if (trackedViews.has(projectId)) return;
    try {
      const response = await API.post(`/projects/investor/track-view/${projectId}`);
      if (response.data.success && response.data.newView) {
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, views: response.data.views } : p));
        setTrackedViews(prev => new Set([...prev, projectId]));
      }
    } catch (error) { console.error('Error tracking view:', error); }
  };

  useEffect(() => {
    if (activeTab === 'browse' && projects.length > 0) {
      observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const projectId = parseInt(entry.target.dataset.projectId);
            if (projectId && !trackedViews.has(projectId)) trackProjectView(projectId);
          }
        });
      }, { threshold: 0.3 });
      Object.values(projectCardRefs.current).forEach(ref => { if (ref) observerRef.current.observe(ref); });
      return () => { if (observerRef.current) observerRef.current.disconnect(); };
    }
  }, [activeTab, projects]);

  useEffect(() => { loadDashboardData(); loadBidCredits(); loadBidPacks(); }, []);
  useEffect(() => { if (activeTab === 'profile') loadUserProfile(); if (activeTab === 'payments') loadPaymentHistory(); }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      const projectsResponse = await API.get('/projects/investor/browse');
      setProjects(projectsResponse.data.projects);
      const bidsResponse = await API.get('/projects/investor/my-bids');
      
      const bidsWithConfirmation = bidsResponse.data.bids.map(bid => ({
        ...bid,
        student_confirmed: bid.student_confirmed === true || bid.student_confirmed === 'true' || bid.student_confirmed === 1,
        payment_status: bid.payment_status || bid.payment_status_from_payments || null
      }));
      
      console.log('Bids with confirmation:', bidsWithConfirmation);
      
      setBids(bidsWithConfirmation);
      setStats({
        totalBids: bidsWithConfirmation.length,
        projectsFunded: bidsWithConfirmation.filter(b => b.status === 'approved' && b.payment_status === 'completed').length,
        totalInvested: bidsWithConfirmation.reduce((sum, b) => sum + (b.amount || 0), 0),
        pendingPayments: bidsWithConfirmation.filter(b => b.status === 'approved' && b.payment_status !== 'completed').length
      });
    } catch (error) { 
      console.error('Error loading dashboard data:', error); 
      showPopup('Failed to load dashboard data', 'error'); 
    }
  };

  const loadBidCredits = async () => { try { const res = await API.get('/projects/investor/bid-credits'); setBidCredits(res.data); } catch (error) { console.error('Error loading bid credits:', error); } };
  const loadBidPacks = async () => { try { const res = await API.get('/bid-packs/packs'); setBidPacks(res.data.packs); } catch (error) { console.error('Error loading bid packs:', error); } };
  const loadPaymentHistory = async () => { setTransactionsLoading(true); try { const res = await API.get('/payments/history'); setTransactions(res.data.transactions || []); } catch (error) { showPopup('Failed to load payment history', 'error'); } finally { setTransactionsLoading(false); } };

  const handlePlaceBid = async (projectId) => {
    if (!bidAmount || bidAmount <= 0) { showPopup('Please enter a valid bid amount', 'error'); return; }
    setLoading(true);
    try {
      const response = await API.post('/projects/investor/bid', { project_id: projectId, amount: parseFloat(bidAmount), message: bidMessage });
      if (response.data.success) { showPopup('Bid placed successfully! One bid credit used.', 'success'); setSelectedProject(null); setBidAmount(''); setBidMessage(''); loadDashboardData(); loadBidCredits(); }
      else if (response.data.needsPurchase) { setShowPurchaseModal(true); setSelectedProject(null); }
    } catch (error) { 
      if (error.response?.data?.needsPurchase) setShowPurchaseModal(true); 
      else if (error.response?.data?.message) showPopup(error.response.data.message, 'error');
      else showPopup('Failed to place bid', 'error');
    }
    finally { setLoading(false); }
  };

  const handleLike = async (projectId) => { try { const res = await API.post(`/projects/investor/like/${projectId}`); if (res.data.success) setProjects(prev => prev.map(p => p.id === projectId ? { ...p, likes: res.data.likes, user_has_liked: res.data.liked } : p)); } catch (error) { showPopup('Failed to like project', 'error'); } };

  const openPaymentModal = async (packageId) => {
    setLoading(true);
    try {
      const { data } = await API.post('/bid-packs/create-payment-intent', { packageId });
      setSelectedPack(packageId);
      setClientSecret(data.clientSecret);
      setShowStripeModal(true);
    } catch (error) {
      showPopup(error.response?.data?.message || 'Failed to initialize payment.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showStripeModal && clientSecret && !stripeRef.current) {
      const initStripe = async () => {
        const stripe = await stripePromise;
        stripeRef.current = stripe;
        const elements = stripe.elements({ clientSecret });
        elementsRef.current = elements;
        const cardElement = elements.create('card');
        cardElement.mount(cardElementRef.current);
      };
      initStripe();
    }
  }, [showStripeModal, clientSecret]);

  const handleConfirmPayment = async () => {
    if (!stripeRef.current || !elementsRef.current) return;
    setPaymentProcessing(true);
    try {
      const { error, paymentIntent } = await stripeRef.current.confirmCardPayment(clientSecret, {
        payment_method: { card: elementsRef.current.getElement('card') }
      });
      if (error) showPopup('Payment failed: ' + error.message, 'error');
      else if (paymentIntent.status === 'succeeded') {
        const confirmRes = await API.post('/bid-packs/confirm', {
          paymentIntentId: paymentIntent.id,
          packageId: selectedPack
        });
        if (confirmRes.data.success) {
          showPopup(confirmRes.data.message, 'success');
          setShowStripeModal(false);
          loadBidCredits();
          setShowPurchaseModal(false);
          loadPaymentHistory();
        } else showPopup('Payment succeeded but failed to add credits.', 'error');
      }
    } catch (error) {
      showPopup('An error occurred.', 'error');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const initiateBidPayment = async (bid) => { setPayingBid(bid); setBidPaymentProcessing(true); try { const { data } = await API.post(`/payments/bid/${bid.id}/pay`); setBidPaymentClientSecret(data.clientSecret); setShowBidPaymentModal(true); } catch (error) { showPopup(error.response?.data?.message || 'Failed to initiate payment', 'error'); } finally { setBidPaymentProcessing(false); } };
  useEffect(() => { if (showBidPaymentModal && bidPaymentClientSecret && !paymentStripe) { const initBidPayment = async () => { const stripe = await stripePromise; setPaymentStripe(stripe); const elements = stripe.elements({ clientSecret: bidPaymentClientSecret }); const cardElement = elements.create('card'); cardElement.mount('#bid-payment-card-element'); setPaymentCardElement(cardElement); }; initBidPayment(); } }, [showBidPaymentModal, bidPaymentClientSecret]);
  const confirmBidPayment = async () => { if (!paymentStripe || !paymentCardElement) return; setBidPaymentProcessing(true); try { const { error, paymentIntent } = await paymentStripe.confirmCardPayment(bidPaymentClientSecret, { payment_method: { card: paymentCardElement } }); if (error) showPopup('Payment failed: ' + error.message, 'error'); else if (paymentIntent.status === 'succeeded') { const confirmRes = await API.post('/payments/bid/confirm-payment', { paymentIntentId: paymentIntent.id }); if (confirmRes.data.success) { showPopup('Payment successful!', 'success'); setShowBidPaymentModal(false); setPayingBid(null); loadDashboardData(); loadPaymentHistory(); } else showPopup('Payment succeeded but failed to update.', 'error'); } } catch (error) { showPopup('Payment failed.', 'error'); } finally { setBidPaymentProcessing(false); } };

  const downloadFile = async (fileId, fileName) => { try { const token = localStorage.getItem('token'); const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/deliverables/investor/file/${fileId}/download`, { headers: { 'Authorization': `Bearer ${token}` } }); if (!response.ok) { const errorData = await response.json().catch(() => ({})); throw new Error(errorData.message || `Download failed (${response.status})`); } const blob = await response.blob(); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url); showPopup('File downloaded successfully!', 'success'); } catch (error) { showPopup(error.message, 'error'); } };

  const viewInvestorFiles = async (bid) => {
    console.log('Viewing files for bid:', bid);
    setSelectedBidForInvestorFiles(bid);
    setDeliverablesLoading(true);
    try {
      const accessRes = await API.get(`/payments/bid/${bid.id}/access`);
      console.log('Access response:', accessRes.data);
      if (!accessRes.data.hasAccess) {
        setPendingAccessBid(bid);
        setShowAccessDeniedModal(true);
        setDeliverablesLoading(false);
        return;
      }
      const res = await API.get(`/deliverables/investor/bid/${bid.id}/files`);
      console.log('Files response:', res.data);
      setInvestorDeliverables(res.data.deliverables || []);
      setShowInvestorDeliverablesModal(true);
    } catch (error) {
      console.error('Error in viewInvestorFiles:', error);
      if (error.response?.data?.requiresPayment) {
        setPendingAccessBid(bid);
        setShowAccessDeniedModal(true);
      } else {
        showPopup('Failed to load files: ' + (error.response?.data?.message || error.message), 'error');
      }
    } finally {
      setDeliverablesLoading(false);
    }
  };

  const handleFilterChange = async (e) => { const category = e.target.value; setCategoryFilter(category); try { const res = await API.get(`/projects/investor/browse?category=${encodeURIComponent(category)}`); setProjects(res.data.projects); setTrackedViews(new Set()); } catch (error) { showPopup('Failed to filter projects', 'error'); } };
  const openViewDetails = (project) => { 
    if (project.is_funded && !project.investor_won) {
      showPopup('This project has already been funded by another investor. Bidding is closed.', 'error');
      return;
    }
    setViewingProject(project); 
    trackProjectView(project.id); 
  };
  const handleViewBid = (bid) => setViewingBid(bid);
  const confirmWithdraw = (bidId) => setConfirmModal({ show: true, bidId, message: 'Are you sure you want to withdraw this bid? This action cannot be undone.' });
  const handleWithdrawBid = async (bidId) => { setConfirmModal({ show: false, bidId: null, message: '' }); setWithdrawLoading(true); try { const response = await API.patch(`/projects/investor/bid/${bidId}/withdraw`); if (response.data.success) { showPopup('Bid withdrawn successfully.', 'success'); loadDashboardData(); loadBidCredits(); } else showPopup(response.data.message || 'Failed to withdraw bid', 'error'); } catch (error) { showPopup(error.response?.data?.message || 'Error withdrawing bid', 'error'); } finally { setWithdrawLoading(false); } };
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); };
  const getStatusColor = (status) => { switch (status) { case 'approved': return '#4caf50'; case 'pending': return '#ffb74d'; case 'rejected': return '#f44336'; default: return '#666'; } };
  const getPaymentStatusBadge = (paymentStatus) => { if (!paymentStatus) return null; return <span className={`payment-status-badge ${paymentStatus}`} style={{ backgroundColor: paymentStatus === 'completed' ? '#4caf50' : '#ff9800', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', marginLeft: '8px' }}>{paymentStatus === 'completed' ? 'Paid' : 'Pending Payment'}</span>; };

  const uniqueBids = bids.reduce((acc, current) => {
    const exists = acc.find(item => item.project_title === current.project_title && item.amount === current.amount);
    if (!exists) acc.push(current);
    return acc;
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-sidebar">
        <div className="sidebar-header"><div className="sidebar-logo"><span className="logo-name">ProjXchange</span></div></div>
        <div className="sidebar-user"><div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div><div className="user-info"><div className="user-name">{user.name}</div><div className="user-role">Investor</div></div></div>
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><span className="nav-icon">📊</span><span className="nav-text">Dashboard Overview</span></div>
          <div className={`nav-item ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => setActiveTab('browse')}><span className="nav-icon">🔍</span><span className="nav-text">Browse Projects</span></div>
          <div className={`nav-item ${activeTab === 'bids' ? 'active' : ''}`} onClick={() => setActiveTab('bids')}><span className="nav-icon">💼</span><span className="nav-text">My Bids</span></div>
          <div className={`nav-item ${activeTab === 'funded' ? 'active' : ''}`} onClick={() => setActiveTab('funded')}><span className="nav-icon">💰</span><span className="nav-text">Funded Projects</span></div>
          <div className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}><span className="nav-icon">💳</span><span className="nav-text">Payments</span></div>
          
          <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}><span className="nav-icon">⚙️</span><span className="nav-text">Profile Settings</span></div>
        </nav>
        <div className="sidebar-footer"><button onClick={handleLogout} className="logout-btn"><span className="logout-icon">🚪</span>Logout</button></div>
      </div>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left"><h1 className="page-title">{activeTab === 'dashboard' && 'Investor Dashboard'}{activeTab === 'browse' && 'Browse Projects'}{activeTab === 'bids' && 'My Bids'}{activeTab === 'funded' && 'Funded Projects'}{activeTab === 'payments' && 'Payment History'}{activeTab === 'profile' && 'Profile Settings'}</h1><p className="welcome-message">Welcome, {user.name} 👋</p></div>
          <div className="header-right"><div className="bid-credits-badge">🎫 Bids: {bidCredits.totalBids} ({bidCredits.freeBids} free, {bidCredits.paidBids} paid)</div><button className="buy-bids-btn" onClick={() => setShowPurchaseModal(true)}>+ Buy Bids</button><div className="notification-bell">🔔</div><div className="user-avatar-small" onClick={() => setActiveTab('profile')}>{user.name.charAt(0).toUpperCase()}</div></div>
        </header>

        <div className="dashboard-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-overview">
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-icon">💼</div><div className="stat-info"><div className="stat-number">{stats.totalBids}</div><div className="stat-label">Total Bids Placed</div></div></div>
                <div className="stat-card"><div className="stat-icon">📈</div><div className="stat-info"><div className="stat-number">{stats.projectsFunded}</div><div className="stat-label">Projects Funded</div></div></div>
                <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-info"><div className="stat-number">₨ {stats.totalInvested.toLocaleString()}</div><div className="stat-label">Total Amount Invested</div></div></div>
                <div className="stat-card"><div className="stat-icon">⏳</div><div className="stat-info"><div className="stat-number">{stats.pendingPayments}</div><div className="stat-label">Pending Payments</div></div></div>
              </div>
              <div className="recent-activity"><h2>Recent Activities</h2>{bids.slice(0,3).map(bid => <div key={bid.id} className="activity-item"><div className="activity-content"><p>You placed a bid of ₨ {bid.amount} on "{bid.project_title}" - Status: {bid.status}</p><span className="activity-time">{new Date(bid.created_at).toLocaleDateString()}</span></div></div>)}{bids.length===0 && <p>No recent activities</p>}</div>
            </div>
          )}

          {activeTab === 'browse' && (
            <div className="browse-projects">
              <div className="projects-header"><h2>Browse Projects</h2><div className="filter-section"><select className="form-select" value={categoryFilter} onChange={handleFilterChange} style={{width:'200px'}}><option>All Categories</option><option>Web Development</option><option>AI & Machine Learning</option><option>Blockchain</option><option>Mobile Apps</option><option>Data Science</option><option>Cybersecurity</option><option>IoT</option></select></div></div>
              <div className="projects-grid">
                {projects.map(project => (
                  <div key={project.id} className="project-card" ref={el => projectCardRefs.current[project.id] = el} data-project-id={project.id}>
                    <div className="project-header">
                      <h3>{project.title}</h3>
                      <span className="project-category">{project.category}</span>
                      {/* Badges for funding status */}
                      {project.investor_won && (
                        <span className="funded-badge">✅ Funded by you</span>
                      )}
                      {project.is_funded && !project.investor_won && (
                        <span className="funded-badge other">🔒 Already Funded</span>
                      )}
                    </div>
                    <p className="project-description">{project.description?.substring(0,150)}...</p>
                    <div className="project-meta">
                      <div className="project-student"><strong>Student:</strong> {project.student_name}</div>
                      {project.funding_goals && <div className="project-funding"><strong>Funding Goal:</strong> ₨ {project.funding_goals}</div>}
                    </div>
                    <div className="project-technologies"><strong>Technologies:</strong> {project.technologies || 'Not specified'}</div>
                    <div className="project-stats">
                      <span className="stat">👁️ {project.views || 0} views</span>
                      <span className="stat">❤️ {project.likes || 0} likes</span>
                      <button className={`like-btn ${project.user_has_liked ? 'liked' : ''}`} onClick={() => handleLike(project.id)}>{project.user_has_liked ? '❤️ Liked' : '🤍 Like'}</button>
                    </div>
                    <div className="project-actions">
                      {project.is_funded && !project.investor_won ? (
                        <button className="btn btn-secondary" disabled style={{opacity:0.6, cursor:'not-allowed'}}>
                          Already Funded
                        </button>
                      ) : (
                        <button 
                          className="btn btn-primary" 
                          onClick={() => setSelectedProject(project)} 
                          disabled={bidCredits.totalBids === 0}
                        >
                          Place Bid {bidCredits.totalBids === 0 && '(No credits)'}
                        </button>
                      )}
                      <button className="btn btn-outline" onClick={() => openViewDetails(project)}>
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedProject && (
            <div className="modal-overlay"><div className="modal-content"><div className="modal-header"><h3>Place Bid on {selectedProject.title}</h3><button onClick={() => setSelectedProject(null)} className="close-btn">×</button></div><div className="modal-body"><div className="bid-info"><p><strong>Student:</strong> {selectedProject.student_name}</p><p><strong>Email:</strong> {selectedProject.student_email}</p><p><strong>Funding Goal:</strong> ₨ {selectedProject.funding_goals}</p></div><div className="form-group"><label>Bid Amount (₨)</label><input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder="Enter bid amount in PKR" className="form-input" /></div><div className="form-group"><label>Message to Student (Optional)</label><textarea value={bidMessage} onChange={(e) => setBidMessage(e.target.value)} placeholder="Add a message..." className="form-textarea" rows="3" /></div><div className="bid-credits-info">You have {bidCredits.totalBids} bid credit(s) available. One credit will be used.</div></div><div className="modal-actions"><button onClick={() => setSelectedProject(null)} className="btn btn-outline">Cancel</button><button onClick={() => handlePlaceBid(selectedProject.id)} className="btn btn-primary" disabled={!bidAmount || loading}>{loading ? 'Processing...' : 'Place Bid'}</button></div></div></div>
          )}

          {viewingProject && (
            <div className="modal-overlay" onClick={() => setViewingProject(null)}><div className="modal-content wide" onClick={(e) => e.stopPropagation()} style={{maxWidth:'700px',width:'90%'}}><div className="modal-header"><h3>Project Details: {viewingProject.title}</h3><button onClick={() => setViewingProject(null)} className="close-btn">×</button></div><div className="modal-body"><div className="view-details-content"><div className="detail-section"><h4>Description</h4><p>{viewingProject.description || 'No description provided.'}</p></div><div className="detail-section"><h4>Technologies</h4><p>{viewingProject.technologies || 'Not specified'}</p></div><div className="detail-section"><h4>Funding Goal</h4><p>₨ {viewingProject.funding_goals || 'Not specified'}</p></div><div className="detail-section"><h4>Timeline</h4><p>{viewingProject.timeline ? `${viewingProject.timeline} weeks` : 'Not specified'}</p></div><div className="detail-section"><h4>Student Information</h4><p><strong>Name:</strong> {viewingProject.student_name}</p><p><strong>Email:</strong> {viewingProject.student_email}</p>{viewingProject.student_phone && <p><strong>Phone:</strong> {viewingProject.student_phone}</p>}</div>{viewingProject.file_path && (<div className="detail-section"><h4>Project File (PDF)</h4><a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/projects/${viewingProject.id}/file`} target="_blank" rel="noopener noreferrer" className="view-pdf-link" style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'#2196F3',color:'white',padding:'8px 16px',borderRadius:'6px',textDecoration:'none'}}>📄 View / Download PDF</a></div>)}</div></div><div className="modal-actions"><button onClick={() => setViewingProject(null)} className="btn-secondary">Close</button><button onClick={() => { setViewingProject(null); setSelectedProject(viewingProject); }} className="btn-primary">Place a Bid</button></div></div></div>
          )}

          {activeTab === 'bids' && (
            <div className="my-bids">
              <h2>My Bids</h2>
              {uniqueBids.length === 0 ? (<div className="no-data"><p>You haven't placed any bids yet.</p><button onClick={() => setActiveTab('browse')} className="btn btn-primary">Browse Projects</button></div>) : (
                <div className="bids-table-container">
                  <table className="bids-table">
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Date</th>
                        <th>Actions</th>
                        <th>Files</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueBids.map(bid => (
                        <tr key={bid.id}>
                          <td>
                            <strong>{bid.project_title}</strong><br/>
                            <small>{bid.project_description?.substring(0,50)}...</small>
                          </td>
                          <td>₨ {bid.amount}</td>
                          <td><span className="status-badge" style={{backgroundColor:getStatusColor(bid.status)}}>{bid.status}</span></td>
                          <td>
                            {bid.status === 'approved' && getPaymentStatusBadge(bid.payment_status)}
                            {bid.status !== 'approved' && '—'}
                          </td>
                          <td>{new Date(bid.created_at).toLocaleDateString()}</td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn btn-outline btn-sm" onClick={() => handleViewBid(bid)}>View</button>
                              {bid.status === 'pending' && <button className="btn btn-outline btn-sm" onClick={() => confirmWithdraw(bid.id)} disabled={withdrawLoading}>Withdraw</button>}
                              {bid.status === 'approved' && bid.payment_status !== 'completed' && <button className="btn btn-primary btn-sm" onClick={() => initiateBidPayment(bid)} disabled={bidPaymentProcessing}>Pay Now</button>}
                            </div>
                           </td>
                          <td>
                            {bid.status === 'approved' ? (
                              <>
                                {bid.payment_status !== 'completed' && (
                                  <button className="btn btn-outline btn-sm" onClick={() => initiateBidPayment(bid)} style={{backgroundColor: '#ff9800', color: 'white', border: 'none'}}>
                                    💳 Pay first
                                  </button>
                                )}
                                {bid.payment_status === 'completed' && !bid.student_confirmed && (
                                  <button className="btn btn-outline btn-sm disabled-download" disabled style={{cursor: 'not-allowed', opacity: 0.6}}>
                                    ⏳ Awaiting confirmation
                                  </button>
                                )}
                                {bid.payment_status === 'completed' && bid.student_confirmed === true && (
                                  <button className="btn btn-outline btn-sm" onClick={() => viewInvestorFiles(bid)} style={{backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer'}}>
                                    📥 Download Files
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="no-action">—</span>
                            )}
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {viewingBid && (
            <div className="modal-overlay" onClick={() => setViewingBid(null)}><div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth:'500px'}}><div className="modal-header"><h3>Bid Details</h3><button onClick={() => setViewingBid(null)} className="close-btn">×</button></div><div className="modal-body"><div className="detail-section"><p><strong>Project:</strong> {viewingBid.project_title}</p><p><strong>Amount:</strong> ₨ {viewingBid.amount}</p><p><strong>Status:</strong> <span className="status-badge" style={{backgroundColor:getStatusColor(viewingBid.status)}}>{viewingBid.status}</span></p><p><strong>Payment Status:</strong> {viewingBid.payment_status || 'N/A'}</p><p><strong>Student Confirmed:</strong> {viewingBid.student_confirmed ? 'Yes' : 'No'}</p><p><strong>Date:</strong> {new Date(viewingBid.created_at).toLocaleString()}</p>{viewingBid.message && <p><strong>Message:</strong> {viewingBid.message}</p>}<p><strong>Student:</strong> {viewingBid.student_name}</p></div></div><div className="modal-actions"><button onClick={() => setViewingBid(null)} className="btn-secondary">Close</button>{viewingBid.status === 'pending' && <button onClick={() => { setViewingBid(null); confirmWithdraw(viewingBid.id); }} className="btn-danger" disabled={withdrawLoading}>Withdraw</button>}</div></div></div>
          )}

          {activeTab === 'funded' && (
            <div className="funded-projects"><h2>Funded Projects</h2>{bids.filter(b => b.status === 'approved' && b.payment_status === 'completed').length === 0 ? <p>No funded projects yet.</p> : <div className="funded-list">{bids.filter(b => b.status === 'approved' && b.payment_status === 'completed').map(bid => (<div key={bid.id} className="funded-card"><h3>{bid.project_title}</h3><p>Amount: ₨ {bid.amount}</p><p>Student: {bid.student_name}</p><button className="btn-outline btn-sm" onClick={() => viewInvestorFiles(bid)}>📥 Download Files</button></div>))}</div>}</div>
          )}

          {activeTab === 'payments' && (
            <div className="payments-history">
              <div className="section-header">
                <h2>Payment History</h2>
                <p>All your transactions (bid pack purchases and project payments)</p>
              </div>
              {transactionsLoading ? (
                <div className="loading-spinner"></div>
              ) : transactions.length === 0 ? (
                <div className="no-data">
                  <div className="no-data-icon">💳</div>
                  <h3>No transactions yet</h3>
                  <p>Your payment history will appear here.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>{tx.formatted_date}</td>
                          <td>{tx.description}</td>
                          <td>{tx.formatted_amount || `₨ ${tx.amount}`}</td>
                          <td>
                            <span className={`status-badge ${tx.status}`} style={{ backgroundColor: tx.status === 'completed' ? '#4caf50' : '#ff9800' }}>
                              {tx.status}
                            </span>
                           </td>
                          <td>
                            <span className={`transaction-type ${tx.type}`}>
                              {tx.type === 'bid_purchase' ? 'Bid Pack' : 'Project Payment'}
                            </span>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          
          {activeTab === 'profile' && (
            <div className="profile-settings"><div className="profile-container"><div className="profile-edit-section"><div className="section-title"><h3>Edit Profile Information</h3><p>Update your personal information and preferences</p></div><form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }} className="profile-form"><div className="form-group"><label>Full Name *</label><input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="form-input" required /></div><div className="form-group"><label>Email Address *</label><input type="email" value={user?.email || ''} className="form-input disabled" disabled readOnly /><small className="form-hint">Email cannot be changed</small></div><div className="form-group"><label>Phone Number</label><input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="form-input" /></div><div className="form-group"><label>Company / Organization</label><input type="text" value={profileForm.company} onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })} className="form-input" /></div><div className="form-group"><label>Investment Preferences</label><select value={profileForm.investmentPreference} onChange={(e) => setProfileForm({ ...profileForm, investmentPreference: e.target.value })} className="form-select"><option value="">Select preference</option><option value="technology">Technology & Software</option><option value="ai-ml">AI & Machine Learning</option><option value="blockchain">Blockchain & Crypto</option><option value="fintech">FinTech</option><option value="edtech">EdTech</option><option value="healthcare">Healthcare Tech</option><option value="cleantech">Clean Technology</option><option value="other">Other</option></select></div><div className="form-group"><label>Bio / About</label><textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} className="form-textarea" rows="4" /></div><div className="password-section"><h4>Change Password</h4><div className="form-group"><label>Current Password</label><input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className="form-input" /></div><div className="form-row"><div className="form-group"><label>New Password</label><input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="form-input" /></div><div className="form-group"><label>Confirm New Password</label><input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="form-input" /></div></div></div><div className="form-actions"><button type="submit" className="btn-primary" disabled={profileLoading}>{profileLoading ? 'Saving...' : 'Save Changes'}</button><button type="button" onClick={resetProfileForm} className="btn-secondary">Reset</button></div></form></div></div></div>
          )}
        </div>
      </div>

      {/* Purchase Modal - Updated with new PKR packs */}
      {showPurchaseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Purchase Bid Credits</h3>
              <button onClick={() => setShowPurchaseModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <p>You have no bid credits left. Purchase a pack to continue placing bids.</p>
              <div className="bid-packs">
                <div className="bid-pack-card">
                  <h4>1 Bid</h4>
                  <p>₨ 150</p>
                  <button onClick={() => openPaymentModal(1)} className="btn btn-primary">Buy Now</button>
                </div>
                <div className="bid-pack-card">
                  <h4>2 Bids</h4>
                  <p>₨ 300</p>
                  <button onClick={() => openPaymentModal(2)} className="btn btn-primary">Buy Now</button>
                </div>
                <div className="bid-pack-card">
                  <h4>4 Bids</h4>
                  <p>₨ 600</p>
                  <button onClick={() => openPaymentModal(3)} className="btn btn-primary">Buy Now</button>
                </div>
                <div className="bid-pack-card">
                  <h4>6 Bids</h4>
                  <p>₨ 900</p>
                  <button onClick={() => openPaymentModal(4)} className="btn btn-primary">Buy Now</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStripeModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header"><h3>Complete Payment</h3><button onClick={() => setShowStripeModal(false)} className="close-btn">×</button></div>
            <div className="modal-body">
              <p>Pay for <strong>{
                selectedPack === 1 ? '1' : selectedPack === 2 ? '2' : selectedPack === 3 ? '4' : '6'
              } bid credits</strong> (₨ {
                selectedPack === 1 ? '150' : selectedPack === 2 ? '300' : selectedPack === 3 ? '600' : '900'
              })</p>
              <div ref={cardElementRef} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', margin: '15px 0' }}></div>
              <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '15px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                <strong>💳 Test Card:</strong> 4242 4242 4242 4242 | Any future expiry | Any CVC
              </div>
              <button onClick={handleConfirmPayment} className="btn btn-primary" disabled={paymentProcessing} style={{ width: '100%' }}>
                {paymentProcessing ? 'Processing...' : `Pay ₨ ${selectedPack === 1 ? '150' : selectedPack === 2 ? '300' : selectedPack === 3 ? '600' : '900'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBidPaymentModal && payingBid && (
        <div className="modal-overlay" onClick={() => setShowBidPaymentModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Complete Project Payment</h3><button onClick={() => setShowBidPaymentModal(false)} className="close-btn">×</button></div>
            <div className="modal-body">
              <p><strong>Project:</strong> {payingBid.project_title}</p>
              <p><strong>Amount to Pay:</strong> ₨ {payingBid.amount}</p>
              <p><strong>Student:</strong> {payingBid.student_name}</p>
              <div id="bid-payment-card-element" style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', margin: '15px 0' }}></div>
              <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '15px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}><strong>💳 Test Card:</strong> 4242 4242 4242 4242 | Any future expiry | Any CVC</div>
            </div>
            <div className="modal-actions"><button onClick={() => setShowBidPaymentModal(false)} className="btn-secondary">Cancel</button><button onClick={confirmBidPayment} className="btn-primary" disabled={bidPaymentProcessing}>{bidPaymentProcessing ? 'Processing...' : `Pay ₨ ${payingBid.amount}`}</button></div>
          </div>
        </div>
      )}

      {showAccessDeniedModal && pendingAccessBid && (
        <div className="modal-overlay" onClick={() => setShowAccessDeniedModal(false)}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Access Restricted</h3><button onClick={() => setShowAccessDeniedModal(false)} className="close-btn">×</button></div>
            <div className="modal-body"><p>You need to complete the payment for this project before you can download files.</p><p><strong>Project:</strong> {pendingAccessBid.project_title}</p><p><strong>Amount:</strong> ₨ {pendingAccessBid.amount}</p></div>
            <div className="modal-actions"><button onClick={() => setShowAccessDeniedModal(false)} className="btn-secondary">Cancel</button><button onClick={() => { setShowAccessDeniedModal(false); initiateBidPayment(pendingAccessBid); }} className="btn-primary">Pay Now</button></div>
          </div>
        </div>
      )}

      {showInvestorDeliverablesModal && selectedBidForInvestorFiles && (
        <div className="modal-overlay" onClick={() => setShowInvestorDeliverablesModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Project Files</h3><button onClick={() => setShowInvestorDeliverablesModal(false)} className="close-btn">×</button></div>
            <div className="modal-body">
              <p><strong>Project:</strong> {selectedBidForInvestorFiles.project_title}</p>
              {deliverablesLoading ? <p>Loading files...</p> : investorDeliverables.length === 0 ? <p>No files have been uploaded by the student yet.</p> : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {investorDeliverables.map(file => (
                    <li key={file.id} style={{ padding: '10px', borderBottom: '1px solid #eee', marginBottom: '8px' }}>
                      <div><strong>{file.file_name}</strong> ({(file.file_size / 1024 / 1024).toFixed(2)} MB)<br/>{file.description && <small>{file.description}</small>}</div>
                      <button onClick={() => downloadFile(file.id, file.file_name)} className="btn-primary btn-sm" style={{ display: 'inline-block', marginTop: '8px', padding: '6px 12px', fontSize: '0.85rem', border: 'none', cursor: 'pointer' }}>⬇ Download</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="modal-actions"><button onClick={() => setShowInvestorDeliverablesModal(false)} className="btn-secondary">Close</button></div>
          </div>
        </div>
      )}

      {confirmModal.show && (
        <div className="modal-overlay" onClick={() => setConfirmModal({ show: false, bidId: null, message: '' })}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Confirm Withdrawal</h3><button onClick={() => setConfirmModal({ show: false, bidId: null, message: '' })} className="close-btn">×</button></div>
            <div className="modal-body"><p>{confirmModal.message}</p></div>
            <div className="modal-actions"><button onClick={() => setConfirmModal({ show: false, bidId: null, message: '' })} className="btn-secondary">Cancel</button><button onClick={() => handleWithdrawBid(confirmModal.bidId)} className="btn-danger">Yes, Withdraw</button></div>
          </div>
        </div>
      )}

      {popup.show && (<div className={`popup-notification ${popup.type === 'error' ? 'error' : 'success'}`}><p>{popup.message}</p></div>)}

      <style>{`
        .dashboard-content { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 12px; display: inline-block; align-items: center; gap: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .stat-icon { font-size: 1rem; }
        .stat-number { font-size: 2rem; font-weight: bold; color: #2d6374; display:inline-block }
        .stat-label { font-size: 0.8rem; color: #666; }
        .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; margin-top: 8px; }
        .project-card { background: white; border-radius: 16px; overflow: hidden; transition: transform 0.25s ease, box-shadow 0.25s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eef2f5; }
        .project-card:hover { transform: translateY(-6px); box-shadow: 0 12px 28px rgba(0,0,0,0.12); }
        .project-header { padding: 20px 20px 12px 20px; background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border-bottom: 1px solid #eef2f5; position: relative; }
        .project-header h3 { margin: 0 0 8px 0; font-size: 1.25rem; font-weight: 600; color: #1e2a32; }
        .project-category { display: inline-block; background: #aae5f3; color: #000304; font-size: 0.75rem; font-weight: 600; padding: 3px 8px; border-radius: 50px; }
        .funded-badge { display: inline-block; background: #4caf50; color: white; font-size: 0.7rem; padding: 3px 10px; border-radius: 20px; margin-left: 10px; vertical-align: middle; }
        .funded-badge.other { background: #f44336; }
        .project-description { padding: 16px 20px 0 20px; color: #4a5b6b; font-size: 0.9rem; line-height: 1.5; }
        .project-actions { padding: 16px 20px; display: flex; gap: 12px; }
        .project-actions .btn { flex: 1; text-align: center; padding: 10px 0; border-radius: 40px; font-weight: 600; }
        .btn-primary { background: #2d6374; color: white; border: none; cursor: pointer; }
        .btn-outline { background: transparent; border: 1px solid #2d6374; color: #2d6374; cursor: pointer; }
        .bids-table-container { background: white; border-radius: 16px; overflow-x: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .bids-table { width: 100%; border-collapse: collapse; min-width: 700px; }
        .bids-table th { text-align: left; padding: 16px 20px; background: #f8fafc; font-weight: 600; color: #2d6374; border-bottom: 2px solid #eef2f5; }
        .bids-table td { padding: 14px 20px; border-bottom: 1px solid #eef2f5; vertical-align: middle; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 30px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize; color: white; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; }
        .modal-header { padding: 16px 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
        .modal-body { padding: 20px; }
        .modal-actions { padding: 16px 20px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 12px; }
        .popup-notification { position: fixed; bottom: 30px; right: 30px; padding: 12px 20px; border-radius: 8px; color: white; font-weight: 500; z-index: 2000; animation: slideIn 0.3s ease; }
        .popup-notification.success { background: #4caf50; }
        .popup-notification.error { background: #f44336; }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .disabled-download { cursor: not-allowed !important; opacity: 0.6; }
        .btn-sm { padding: 4px 10px; font-size: 0.75rem; }
        .action-buttons { display: flex; gap: 6px; flex-wrap: wrap; }
        .no-action { color: #999; }
        .bid-credits-badge { background: #f0f0f0; padding: 8px 12px; border-radius: 20px; font-size: 0.9rem; margin-right: 15px; }
        .buy-bids-btn { background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; margin-right: 15px; }
        .like-btn { background: none; border: none; cursor: pointer; font-size: 0.9rem; color: #666; }
        .like-btn.liked { color: #e91e63; }
        .payment-status-badge { display: inline-block; }
        .transaction-type { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 500; background: #e0e0e0; color: #333; }
        .transaction-type.bid_purchase { background: #2196F3; color: white; }
        .transaction-type.bid_acceptance { background: #4caf50; color: white; }
      `}</style>
    </div>
  );
}