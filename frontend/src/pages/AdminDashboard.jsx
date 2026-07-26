import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import '../styles.css';

// Import Chart.js for visualization
import { Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend 
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalInvestors: 0,
    totalProjects: 0,
    activeBids: 0,
    approvedFundings: 0,
    complaintsPending: 0,
    totalRevenue: 0,
    platformEarnings: 0,
    totalTransactions: 0,
    completedTransactions: 0,
    pendingApprovals: 0,
    pendingCommunityQueries: 0
  });
  
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [editRequests, setEditRequests] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allBids, setAllBids] = useState([]);
  const navigate = useNavigate();

  // User modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    phone: '',
    cnic: '',
    is_active: true
  });

  // Project modal states
  const [showProjectViewModal, setShowProjectViewModal] = useState(false);
  const [showProjectEditModal, setShowProjectEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    category: '',
    technologies: '',
    university_name: '',
    funding_goals: '',
    timeline: '',
    admin_notes: ''
  });

  const [statusForm, setStatusForm] = useState({
    status: 'pending',
    admin_notes: ''
  });

  // Approval modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalForm, setApprovalForm] = useState({
    status: 'approved',
    admin_notes: ''
  });

  // Community modal states
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  // NEW: Delete user modal state
  const [showDeleteUserModal, setShowDeleteUserModal] = useState({ 
    show: false, 
    userId: null, 
    userName: '' 
  });

  const [popup, setPopup] = useState({ show: false, msg: "", error: false });

  // Show popup notification
  const showPopup = (msg, error = false) => {
    setPopup({ show: true, msg, error });
    setTimeout(() => setPopup({ show: false, msg: "", error: false }), 3000);
  };

  // Load data based on active tab
  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, user]);

  const loadTabData = async (tab) => {
    setLoading(true);
    setError('');
    
    try {
      let endpoint = '';
      let dataKey = '';
      
      switch(tab) {
        case 'dashboard': 
          endpoint = '/admin/stats'; 
          break;
        case 'users': 
          endpoint = '/admin/users'; 
          break;
        case 'projects': 
          endpoint = '/admin/projects'; 
          break;
        case 'approvals': 
          endpoint = '/admin/approvals'; 
          break;
        case 'community': 
          endpoint = '/admin/community'; 
          break;
        case 'payments': 
          endpoint = '/admin/transactions'; 
          break;
        case 'allBids': 
          endpoint = '/admin/bids'; 
          break;  
        default: 
          return;
      }

      const response = await API.get(endpoint);
      
      if (response.data.success) {
        switch(tab) {
          case 'dashboard':
            setStats(response.data);
            break;
          case 'users':
            setUsers(response.data.users || []);
            break;
          case 'projects':
            setProjects(response.data.projects || []);
            break;
          case 'approvals':
            setEditRequests(response.data.editRequests || []);
            break;
          case 'community':
            setCommunityPosts(response.data.communityPosts || []);
            break;
          case 'payments':
            setTransactions(response.data.transactions || []);
            break;
          case 'allBids':
            setAllBids(response.data.bids || []);
            break;
        }
      } else {
        setError(response.data.message || 'Failed to load data');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Network error');
      
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onLogout) onLogout();
    navigate('/login');
  };

  // ---------- USER CRUD OPERATIONS ----------
  
  // Open create modal
  const openCreateModal = () => {
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'student',
      phone: '',
      cnic: '',
      is_active: true
    });
    setShowCreateModal(true);
  };

  // Open edit modal
  const openEditModal = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name || '',
      email: user.email || '',
      password: '', // Don't show password
      role: user.role || 'student',
      phone: user.phone || '',
      cnic: user.cnic || '',
      is_active: user.is_active !== false
    });
    setShowEditModal(true);
  };

  // Create new user
  const handleCreateUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password || !userForm.role) {
      showPopup('Please fill all required fields: Name, Email, Password, Role', true);
      return;
    }

    try {
      const response = await API.post('/admin/users', userForm);
      
      if (response.data.success) {
        if (response.data.emailSent) {
          showPopup('✅ User created successfully! Login credentials sent to their email.');
        } else {
          showPopup('✅ User created successfully! (Email sending failed - check email configuration)', true);
        }
        setShowCreateModal(false);
        loadTabData('users');
      } else {
        showPopup(response.data.message || 'Failed to create user', true);
      }
    } catch (err) {
      showPopup(err.response?.data?.message || 'Failed to create user', true);
    }
  };

  // Update user
  const handleUpdateUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.role) {
      showPopup('Name, Email, and Role are required', true);
      return;
    }

    try {
      const response = await API.patch(`/admin/users/${editingUser.id}`, {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        phone: userForm.phone,
        cnic: userForm.cnic,
        is_active: userForm.is_active
      });
      
      if (response.data.success) {
        showPopup('✅ User updated successfully');
        setShowEditModal(false);
        setEditingUser(null);
        loadTabData('users');
      } else {
        showPopup(response.data.message || 'Failed to update user', true);
      }
    } catch (err) {
      showPopup(err.response?.data?.message || 'Failed to update user', true);
    }
  };

  // Toggle user status
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const response = await API.patch(`/admin/users/${userId}/status`, { 
        is_active: newStatus 
      });
      
      if (response.data.success) {
        showPopup(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
        loadTabData('users');
      } else {
        showPopup(response.data.message || 'Failed to update status', true);
      }
    } catch (err) {
      showPopup(err.response?.data?.message || 'Failed to update status', true);
    }
  };

  // NEW: Delete user with popup confirmation
  const deleteUser = async (userId, userName) => {
    setShowDeleteUserModal({
      show: true,
      userId: userId,
      userName: userName
    });
  };

  // NEW: Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!showDeleteUserModal.userId) return;

    try {
      const response = await API.delete(`/admin/users/${showDeleteUserModal.userId}`);
      
      if (response.data.success) {
        showPopup('✅ User deleted successfully');
        loadTabData('users');
      } else {
        showPopup(response.data.message || 'Failed to delete user', true);
      }
    } catch (err) {
      showPopup(err.response?.data?.message || 'Failed to delete user', true);
    }
    
    setShowDeleteUserModal({ show: false, userId: null, userName: '' });
  };

  // ---------- PROJECT CRUD OPERATIONS ----------
  
  // Open project view modal
  const openProjectViewModal = (project) => {
    setSelectedProject(project);
    setShowProjectViewModal(true);
  };

  // Open project edit modal
  const openProjectEditModal = (project) => {
    setSelectedProject(project);
    setProjectForm({
      title: project.title || '',
      description: project.description || '',
      category: project.category || '',
      technologies: project.technologies || '',
      university_name: project.university_name || '',
      funding_goals: project.funding_goals || project.funding_goal || '',
      timeline: project.timeline || '',
      admin_notes: project.admin_notes || ''
    });
    setShowProjectEditModal(true);
  };

  // Open status change modal
  const openStatusModal = (project) => {
    setSelectedProject(project);
    setStatusForm({
      status: project.status || 'pending',
      admin_notes: project.admin_notes || ''
    });
    setShowStatusModal(true);
  };

  // Update project details
  const handleUpdateProject = async () => {
    if (!projectForm.title || !projectForm.description || !projectForm.category) {
      showPopup('Title, description, and category are required', true);
      return;
    }

    try {
      const response = await API.patch(`/admin/projects/${selectedProject.id}`, projectForm);
      
      if (response.data.success) {
        showPopup('✅ Project updated successfully');
        setShowProjectEditModal(false);
        setSelectedProject(null);
        loadTabData('projects');
      } else {
        showPopup(response.data.message || 'Failed to update project', true);
      }
    } catch (err) {
      showPopup(err.response?.data?.message || 'Failed to update project', true);
    }
  };

  // Update project status
  const handleUpdateStatus = async () => {
    try {
      const response = await API.patch(`/admin/projects/${selectedProject.id}/status`, statusForm);
      
      if (response.data.success) {
        showPopup(`✅ Project ${statusForm.status} successfully`);
        setShowStatusModal(false);
        setSelectedProject(null);
        loadTabData('projects');
      } else {
        showPopup(response.data.message || 'Failed to update status', true);
      }
    } catch (err) {
      showPopup(err.response?.data?.message || 'Failed to update status', true);
    }
  };

  // Delete project
  const deleteProject = async (projectId, projectTitle) => {
    if (!window.confirm(`Are you sure you want to delete project "${projectTitle}"?`)) {
      return;
    }

    try {
      const response = await API.delete(`/admin/projects/${projectId}`);
      
      if (response.data.success) {
        showPopup('✅ Project deleted successfully');
        loadTabData('projects');
      } else {
        showPopup(response.data.message || 'Failed to delete project', true);
      }
    } catch (err) {
      showPopup(err.response?.data?.message || 'Failed to delete project', true);
    }
  };

  // ---------- APPROVAL OPERATIONS ----------
  
  // Open approval modal
  const openApprovalModal = (request) => {
    setSelectedRequest(request);
    setApprovalForm({
      status: 'approved',
      admin_notes: ''
    });
    setShowApprovalModal(true);
  };

  // Handle approval/rejection
  const handleApprovalDecision = async () => {
    if (!selectedRequest) return;

    try {
      const response = await API.patch(`/admin/approvals/${selectedRequest.id}`, approvalForm);
      
      if (response.data.success) {
        showPopup(`✅ Edit request ${approvalForm.status} successfully`);
        setShowApprovalModal(false);
        setSelectedRequest(null);
        loadTabData('approvals');
      } else {
        showPopup(response.data.message || 'Failed to update request', true);
      }
    } catch (err) {
      showPopup(err.response?.data?.message || 'Failed to update request', true);
    }
  };

  // ---------- COMMUNITY OPERATIONS ----------
  
  // Open comment delete modal
  const openCommentModal = (comment) => {
    setSelectedComment(comment);
    setDeleteReason('');
    setShowCommentModal(true);
  };

  // Delete comment
  const handleDeleteComment = async () => {
    if (!selectedComment) return;

    if (!deleteReason.trim()) {
      showPopup('Please provide a reason for deletion', true);
      return;
    }

    try {
      const response = await API.delete(`/admin/community/comments/${selectedComment.id}`, {
        data: { reason: deleteReason }
      });
      
      if (response.data.success) {
        showPopup('✅ Comment deleted successfully');
        setShowCommentModal(false);
        setSelectedComment(null);
        loadTabData('community');
      } else {
        showPopup(response.data.message || 'Failed to delete comment', true);
      }
    } catch (err) {
      showPopup(err.response?.data?.message || 'Failed to delete comment', true);
    }
  };

  // Update post/comment status
  const updateCommunityStatus = async (type, id, status) => {
    try {
      const response = await API.patch(`/admin/community/${type}/${id}/status`, { status });
      
      if (response.data.success) {
        showPopup(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} ${status} successfully`);
        loadTabData('community');
      } else {
        showPopup(response.data.message || 'Failed to update status', true);
      }
    } catch (err) {
      showPopup(err.response?.data?.message || 'Failed to update status', true);
    }
  };

  // Refresh data function
  const refreshData = () => {
    loadTabData(activeTab);
    showPopup('Data refreshed successfully');
  };

  // ---------- CHART DATA ----------
  
  const pieChartData = {
    labels: ['Students', 'Investors', 'Admins'],
    datasets: [
      {
        data: [
          stats.totalStudents || 0,
          stats.totalInvestors || 0,
          users.filter(u => u.role === 'admin').length
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // ---------- HELPER FUNCTIONS ----------
  
  const getRoleBadge = (role) => {
    const colors = { 
      student: '#4CAF50', 
      investor: '#2196F3', 
      admin: '#FF9800' 
    };
    
    return (
      <span className="badge" style={{ 
        backgroundColor: colors[role] || '#666',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: '500'
      }}>
        {role}
      </span>
    );
  };

  const getStatusBadge = (is_active) => {
    const status = is_active ? 'Active' : 'Inactive';
    const color = is_active ? '#4CAF50' : '#F44336';
    
    return (
      <span className="status-badge" style={{ 
        backgroundColor: color,
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: '500'
      }}>
        {status}
      </span>
    );
  };

  const getProjectStatusBadge = (status) => {
    const colors = {
      pending: '#FF9800',
      approved: '#4CAF50',
      rejected: '#F44336',
      in_review: '#2196F3',
      completed: '#9C27B0'
    };
    
    return (
      <span className="project-status-badge" style={{ 
        backgroundColor: colors[status] || '#666',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: '500'
      }}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending'}
      </span>
    );
  };

  const getApprovalStatusBadge = (status) => {
    const colors = {
      pending: '#FF9800',
      approved: '#4CAF50',
      rejected: '#F44336'
    };
    
    return (
      <span className="approval-status-badge" style={{ 
        backgroundColor: colors[status] || '#666',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: '500'
      }}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending'}
      </span>
    );
  };

  const getCommunityStatusBadge = (status) => {
    const colors = {
      pending_review: '#FF9800',
      approved: '#4CAF50',
      rejected: '#F44336'
    };
    
    return (
      <span className="community-status-badge" style={{ 
        backgroundColor: colors[status] || '#666',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: '500'
      }}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Parse JSON safely
  const parseJSON = (jsonString) => {
    try {
      return jsonString ? JSON.parse(jsonString) : {};
    } catch (e) {
      return {};
    }
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <span className="logo-name">ProjXchange</span>
        </div>
        
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'Admin'}</div>
            <div className="user-role">Administrator</div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} 
            onClick={() => setActiveTab('dashboard')}
          >
            <span>📊</span> Dashboard Overview
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} 
            onClick={() => setActiveTab('users')}
          >
            <span>👥</span> Manage Users
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`} 
            onClick={() => setActiveTab('projects')}
          >
            <span>📂</span> Manage Projects
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'approvals' ? 'active' : ''}`} 
            onClick={() => setActiveTab('approvals')}
          >
            <span>✅</span> Approvals
            {stats.pendingApprovals > 0 && (
              <span className="nav-badge">{stats.pendingApprovals}</span>
            )}
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'community' ? 'active' : ''}`} 
            onClick={() => setActiveTab('community')}
          >
            <span>💬</span> Error-Solving Community
            {stats.pendingCommunityQueries > 0 && (
              <span className="nav-badge">{stats.pendingCommunityQueries}</span>
            )}
          </div>

          <div 
            className={`nav-item ${activeTab === 'allBids' ? 'active' : ''}`} 
            onClick={() => setActiveTab('allBids')}
          >
            <span>💼</span> All Bids
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`} 
            onClick={() => setActiveTab('payments')}
          >
            <span>💰</span> Payments & Earnings
          </div>
        </nav>
        
        <div className="sidebar-footer">
          <button 
            onClick={refreshData} 
            className="btn btn-outline"
            style={{ marginBottom: '10px', width: '100%' }}
          >
          </button>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1>
              {activeTab === 'dashboard' ? 'Dashboard Overview' : 
               activeTab === 'users' ? 'Manage Users' : 
               activeTab === 'projects' ? 'Manage Projects' : 
               activeTab === 'approvals' ? 'Approval Requests' : 
               activeTab === 'community' ? 'Error-Solving Community' : 
               activeTab === 'allBids' ? 'All Investor Bids' :
               'Payments & Earnings'}
            </h1>
            <p>Welcome back, {user?.name || 'Admin'} 👋</p>
          </div>
          
          <div className="header-actions">
            <button 
              onClick={refreshData}
              className="refresh-btn"
              title="Refresh Data"
            >
              🔄
            </button>
            
            {activeTab === 'users' && (
              <button 
                className="primary-btn" 
                onClick={openCreateModal}
              >
                + Add New User
              </button>
            )}
          </div>
        </header>

        <div className="dashboard-content">
          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Loading {activeTab}...</p>
            </div>
          )}
          
          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={refreshData}>Retry</button>
            </div>
          )}

          {/* DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && !loading && (
            <div className="dashboard-overview">
              <div className="stats-grid">
                <div className="stat-card blue">
                  <h3>Total Students</h3>
                  <h2>{stats.totalStudents}</h2>
                  <p>Registered student users</p>
                </div>
                
                <div className="stat-card green">
                  <h3>Total Investors</h3>
                  <h2>{stats.totalInvestors}</h2>
                  <p>Registered investor users</p>
                </div>
                
                <div className="stat-card purple">
                  <h3>Total Projects</h3>
                  <h2>{stats.totalProjects}</h2>
                  <p>Projects uploaded</p>
                </div>
                
                <div className="stat-card orange">
                  <h3>Active Bids</h3>
                  <h2>{stats.activeBids}</h2>
                  <p>Pending funding requests</p>
                </div>
                
                <div className="stat-card red">
                  <h3>Pending Approvals</h3>
                  <h2>{stats.pendingApprovals}</h2>
                  <p>Edit requests waiting</p>
                </div>
                
                <div className="stat-card teal">
                  <h3>Community Queries</h3>
                  <h2>{stats.pendingCommunityQueries}</h2>
                  <p>Posts/comments to review</p>
                </div>
              </div>

              <div className="charts-section">
                <div className="chart-card">
                  <h3>User Distribution</h3>
                  <div className="chart-container">
                    <Pie data={pieChartData} options={{ responsive: true }} />
                  </div>
                </div>
                
                <div className="chart-card">
                  <h3>Quick Stats</h3>
                  <div className="quick-stats">
                    <div className="quick-stat">
                      <span className="stat-label">Platform Revenue:</span>
                      <span className="stat-value">₨ {stats.totalRevenue || 0}</span>
                    </div>
                    <div className="quick-stat">
                      <span className="stat-label">Platform Earnings:</span>
                      <span className="stat-value">₨ {stats.platformEarnings || 0}</span>
                    </div>
                    <div className="quick-stat">
                      <span className="stat-label">Total Transactions:</span>
                      <span className="stat-value">{stats.totalTransactions || 0}</span>
                    </div>
                    <div className="quick-stat">
                      <span className="stat-label">Completed:</span>
                      <span className="stat-value">{stats.completedTransactions || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MANAGE USERS */}
          {activeTab === 'users' && !loading && (
            <div className="manage-section">
              <div className="section-header">
                <h2>Manage Users ({users.length})</h2>
                <p>View and manage all registered users</p>
              </div>
              
              {users.length === 0 ? (
                <div className="empty-state">
                  <p>No users found</p>
                  <button className="primary-btn" onClick={openCreateModal}>
                    + Create First User
                  </button>
                </div>
              ) : (
                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{getRoleBadge(user.role)}</td>
                          <td>{user.phone || 'N/A'}</td>
                          <td>{getStatusBadge(user.is_active)}</td>
                          <td>{formatDate(user.created_at)}</td>
                          <td className="action-buttons">
                            <button 
                              className="btn-action edit"
                              onClick={() => openEditModal(user)}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn-action toggle"
                              onClick={() => toggleUserStatus(user.id, user.is_active)}
                            >
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button 
                              className="btn-action delete"
                              onClick={() => deleteUser(user.id, user.name)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* MANAGE PROJECTS - CARD VIEW */}
          {activeTab === 'projects' && !loading && (
            <div className="manage-section">
              <div className="section-header">
                <div className="section-header-top">
                  <div>
                    <h2>Manage Projects ({projects.length})</h2>
                    <p>View and manage all projects uploaded by students</p>
                  </div>
                  <div className="project-stats-summary">
                    <span className="stat-badge pending">
                      <span className="stat-label">Pending:</span>
                      <span className="stat-value">
                        {projects.filter(p => p.status === 'pending').length}
                      </span>
                    </span>
                    <span className="stat-badge approved">
                      <span className="stat-label">Approved:</span>
                      <span className="stat-value">
                        {projects.filter(p => p.status === 'approved').length}
                      </span>
                    </span>
                    <span className="stat-badge rejected">
                      <span className="stat-label">Rejected:</span>
                      <span className="stat-value">
                        {projects.filter(p => p.status === 'rejected').length}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              
              {projects.length === 0 ? (
                <div className="empty-state">
                  <p>No projects found</p>
                </div>
              ) : (
                <div className="projects-grid-container">
                  {projects.map((project) => (
                    <div className="project-card" key={project.id}>
                      <div className="project-card-header">
                        <div className="project-card-title-section">
                          <h3 className="project-title">{project.title}</h3>
                          <div className="project-meta">
                            <span className="project-id">ID: #{project.id}</span>
                            <span className="project-category">{project.category || 'Uncategorized'}</span>
                          </div>
                        </div>
                        <div className="project-status-section">
                          {getProjectStatusBadge(project.status)}
                        </div>
                      </div>

                      <div className="project-card-body">
                        <div className="project-description">
                          <p>
                            {project.description && project.description.length > 150 
                              ? `${project.description.substring(0, 150)}...` 
                              : project.description || 'No description available'}
                          </p>
                        </div>
                        
                        <div className="project-info-grid">
                          <div className="info-item">
                            <span className="info-label">Student:</span>
                            <span className="info-value">{project.student_name || 'Unknown'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Email:</span>
                            <span className="info-value">{project.student_email || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Funding Goal:</span>
                            <span className="info-value">
                              {project.funding_goals ? `₨ ${parseFloat(project.funding_goals).toLocaleString()}` : 'Not specified'}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Timeline:</span>
                            <span className="info-value">
                              {project.timeline ? `${project.timeline} weeks` : 'Not specified'}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Technologies:</span>
                            <span className="info-value">
                              {project.technologies || 'Not specified'}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">University:</span>
                            <span className="info-value">
                              {project.university_name || 'Not specified'}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Uploaded:</span>
                            <span className="info-value">
                              {formatDate(project.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="project-card-footer">
                        <div className="card-actions">
                          <button 
                            className="btn-action view"
                            onClick={() => openProjectViewModal(project)}
                          >
                            <span>👁️</span> View Details
                          </button>
                          <button 
                            className="btn-action edit"
                            onClick={() => openProjectEditModal(project)}
                          >
                            <span>✏️</span> Edit
                          </button>
                          <button 
                            className="btn-action status"
                            onClick={() => openStatusModal(project)}
                          >
                            <span>🔄</span> Status
                          </button>
                          <button 
                            className="btn-action delete"
                            onClick={() => deleteProject(project.id, project.title)}
                          >
                            <span>🗑️</span> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* APPROVALS TAB */}
          {activeTab === 'approvals' && !loading && (
            <div className="manage-section">
              <div className="section-header">
                <h2>Edit Request Approvals ({editRequests.length})</h2>
                <p>Review and approve/reject student edit requests</p>
              </div>
              
              {editRequests.length === 0 ? (
                <div className="empty-state">
                  <p>No pending approval requests</p>
                </div>
              ) : (
                <div className="approvals-grid">
                  {editRequests.map((request) => (
                    <div className="approval-card" key={request.id}>
                      <div className="approval-header">
                        <div>
                          <h3>{request.project_title || 'General Edit Request'}</h3>
                          <div className="approval-meta">
                            <span className="approval-type">{request.request_type || 'Edit Request'}</span>
                            <span className="approval-date">{formatDate(request.created_at)}</span>
                          </div>
                        </div>
                        <div className="approval-status">
                          {getApprovalStatusBadge(request.status)}
                        </div>
                      </div>
                      
                      <div className="approval-body">
                        <div className="request-details">
                          <div className="student-info">
                            <strong>Student:</strong> {request.student_name} ({request.student_email})
                          </div>
                          
                          <div className="change-comparison">
                            <div className="current-data">
                              <h4>Current Data:</h4>
                              <pre>{JSON.stringify(parseJSON(request.current_data), null, 2)}</pre>
                            </div>
                            <div className="requested-changes">
                              <h4>Requested Changes:</h4>
                              <pre>{JSON.stringify(parseJSON(request.requested_changes), null, 2)}</pre>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="approval-actions">
                        <button 
                          className="btn-action approve"
                          onClick={() => openApprovalModal(request)}
                        >
                          <span>✅</span> Review Request
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* COMMUNITY TAB */}
          {activeTab === 'community' && !loading && (
            <div className="manage-section">
              <div className="section-header">
                <h2>Error-Solving Community Management</h2>
                <p>Review and moderate community posts and comments</p>
              </div>
              
              <div className="community-stats">
                <div className="stat-badge">
                  <span className="stat-label">Total Posts:</span>
                  <span className="stat-value">{communityPosts.length}</span>
                </div>
                <div className="stat-badge">
                  <span className="stat-label">Pending Review:</span>
                  <span className="stat-value">
                    {communityPosts.filter(p => p.status === 'pending_review').length}
                  </span>
                </div>
                <div className="stat-badge">
                  <span className="stat-label">Total Comments:</span>
                  <span className="stat-value">
                    {communityPosts.reduce((total, post) => total + (post.comments?.length || 0), 0)}
                  </span>
                </div>
              </div>
              
              {communityPosts.length === 0 ? (
                <div className="empty-state">
                  <p>No community posts found</p>
                </div>
              ) : (
                <div className="community-posts">
                  {communityPosts.map((post) => (
                    <div className="community-post-card" key={post.id}>
                      <div className="post-header">
                        <div className="post-author">
                          <div className="author-avatar">
                            {post.user_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="author-info">
                            <strong>{post.user_name}</strong>
                            <span>{post.user_email}</span>
                          </div>
                        </div>
                        <div className="post-meta">
                          <span className="post-category">{post.category}</span>
                          <span className="post-date">{formatDate(post.created_at)}</span>
                          {getCommunityStatusBadge(post.status)}
                        </div>
                      </div>
                      
                      <div className="post-content">
                        <h4>{post.title}</h4>
                        <p>{post.content}</p>
                      </div>
                      
                      <div className="post-actions">
                        <button 
                          className={`btn-action ${post.status === 'approved' ? 'reject' : 'approve'}`}
                          onClick={() => updateCommunityStatus('post', post.id, 
                            post.status === 'approved' ? 'rejected' : 'approved')}
                        >
                          {post.status === 'approved' ? '❌ Reject' : '✅ Approve'}
                        </button>
                      </div>
                      
                      {post.comments && post.comments.length > 0 && (
                        <div className="post-comments">
                          <h5>Comments ({post.comments.length}):</h5>
                          {post.comments.map((comment) => (
                            <div className="comment-item" key={comment.id}>
                              <div className="comment-header">
                                <div className="comment-author">
                                  <div className="comment-avatar">
                                    {comment.user_name?.charAt(0).toUpperCase() || 'U'}
                                  </div>
                                  <div className="comment-author-info">
                                    <strong>{comment.user_name}</strong>
                                    <span>{formatDate(comment.created_at)}</span>
                                  </div>
                                </div>
                                <div className="comment-status">
                                  {getCommunityStatusBadge(comment.status)}
                                </div>
                              </div>
                              
                              <div className="comment-content">
                                <p>{comment.content}</p>
                              </div>
                              
                              <div className="comment-actions">
                                <button 
                                  className={`btn-action ${comment.status === 'approved' ? 'reject' : 'approve'}`}
                                  onClick={() => updateCommunityStatus('comment', comment.id, 
                                    comment.status === 'approved' ? 'rejected' : 'approved')}
                                >
                                  {comment.status === 'approved' ? '❌ Reject' : '✅ Approve'}
                                </button>
                                <button 
                                  className="btn-action delete"
                                  onClick={() => openCommentModal(comment)}
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ALL BIDS TAB */}
          {activeTab === 'allBids' && !loading && (
            <div className="manage-section">
              <div className="section-header">
                <h2>All Investor Bids ({allBids.length})</h2>
                <p>View all bids placed by investors on student projects</p>
              </div>
              {allBids.length === 0 ? (
                <div className="empty-state">
                  <p>No bids found</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Project</th>
                        <th>Investor</th>
                        <th>Student</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allBids.map((bid) => (
                        <tr key={bid.id}>
                          <td style={{ textAlign: 'center' }}>{bid.id}</td>
                          <td><strong>{bid.project_title}</strong></td>
                          <td>
                            {bid.investor_name}<br/>
                            <small style={{ color: '#666' }}>{bid.investor_email}</small>
                          </td>
                          <td>
                            {bid.student_name}<br/>
                            <small style={{ color: '#666' }}>{bid.student_email}</small>
                          </td>
                          <td>₨ {parseFloat(bid.amount).toLocaleString()}</td>
                          <td>
                            <span 
                              className="status-badge" 
                              style={{ 
                                backgroundColor: bid.status === 'approved' ? '#4caf50' : 
                                               bid.status === 'pending' ? '#ff9800' : '#f44336',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                              }}
                            >
                              {bid.status}
                            </span>
                          </td>
                          <td>{formatDate(bid.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PAYMENTS & EARNINGS */}
          {activeTab === 'payments' && !loading && (
            <div className="manage-section">
              <div className="section-header">
                <h2>Payments & Earnings</h2>
                <p>Stripe transactions & platform revenue</p>
              </div>

              {/* Summary Cards */}
              <div className="stats-grid">
                <div className="stat-card green">
                  <h3>Total Revenue</h3>
                  <h2>₨ {stats.totalRevenue || 0}</h2>
                  <p>Gross payments (investor paid)</p>
                </div>

                <div className="stat-card blue">
                  <h3>Platform Earnings</h3>
                  <h2>₨ {stats.platformEarnings || 0}</h2>
                  <p>5% commission earned</p>
                </div>

                <div className="stat-card purple">
                  <h3>Total Transactions</h3>
                  <h2>{stats.totalTransactions || 0}</h2>
                  <p>Stripe payments</p>
                </div>

                <div className="stat-card green">
                  <h3>Net Paid to Students</h3>
                  <h2>₨ {(stats.totalRevenue || 0) - (stats.platformEarnings || 0)}</h2>
                  <p>After 5% platform fee</p>
                </div>
              </div>

              {/* Transactions Table */}
              {transactions.length === 0 ? (
                <div className="empty-state">
                  <p>No transactions found</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Project</th>
                        <th>Amount (Paid)</th>
                        <th>Platform Fee (5%)</th>
                        <th>Net Amount (to Student)</th>
                        <th>Stripe ID</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => (
                        <tr key={tx.id}>
                          <td>{tx.id}</td>
                          <td>
                            <strong>{tx.user_name || 'N/A'}</strong>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {tx.user_email || 'N/A'}
                            </div>
                          </td>
                          <td>{tx.project_title || 'N/A'}</td>
                          <td>₨ {parseFloat(tx.amount).toLocaleString()}</td>
                          <td>₨ {parseFloat(tx.platform_fee || 0).toLocaleString()}</td>
                          <td>₨ {parseFloat(tx.net_amount || 0).toLocaleString()}</td>
                          <td style={{ fontSize: '12px' }}>
                            {tx.stripe_payment_intent_id || '—'}
                          </td>
                          <td>{formatDate(tx.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New User</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={userForm.name}
                  onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={userForm.email}
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={userForm.password}
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={userForm.role}
                  onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <option value="student">Student</option>
                  <option value="investor">Investor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={userForm.phone}
                  onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label>CNIC</label>
                <input
                  type="text"
                  placeholder="Enter CNIC"
                  value={userForm.cnic}
                  onChange={e => setUserForm({ ...userForm, cnic: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={userForm.is_active}
                    onChange={e => setUserForm({ ...userForm, is_active: e.target.checked })}
                  />
                  Active Account
                </label>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-primary" 
                onClick={handleCreateUser}
              >
                Create User
              </button>
              <button 
                className="btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && editingUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit User: {editingUser.name}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={userForm.name}
                  onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={userForm.email}
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={userForm.role}
                  onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <option value="student">Student</option>
                  <option value="investor">Investor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={userForm.phone}
                  onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label>CNIC</label>
                <input
                  type="text"
                  placeholder="Enter CNIC"
                  value={userForm.cnic}
                  onChange={e => setUserForm({ ...userForm, cnic: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={userForm.is_active}
                    onChange={e => setUserForm({ ...userForm, is_active: e.target.checked })}
                  />
                  Active Account
                </label>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-primary" 
                onClick={handleUpdateUser}
              >
                Update User
              </button>
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {showDeleteUserModal.show && (
        <div className="modal-overlay" onClick={() => setShowDeleteUserModal({ show: false, userId: null, userName: '' })}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete User</h3>
              <button 
                className="close-btn"
                onClick={() => setShowDeleteUserModal({ show: false, userId: null, userName: '' })}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-confirmation-message">
                <div className="warning-icon">⚠️</div>
                <p>Are you sure you want to delete user:</p>
                <p className="user-to-delete"><strong>{showDeleteUserModal.userName}</strong></p>
                <p className="warning-text">This action cannot be undone!</p>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowDeleteUserModal({ show: false, userId: null, userName: '' })}
              >
                Cancel
              </button>
              <button 
                className="btn-primary delete"
                onClick={handleConfirmDelete}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROJECT VIEW MODAL */}
      {showProjectViewModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowProjectViewModal(false)}>
          <div className="modal wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Project Details: {selectedProject.title}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowProjectViewModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="project-details-grid">
                <div className="detail-group">
                  <label>Project ID</label>
                  <div className="detail-value">#{selectedProject.id}</div>
                </div>
                
                <div className="detail-group">
                  <label>Student</label>
                  <div className="detail-value">
                    <strong>{selectedProject.student_name || 'Unknown'}</strong>
                    <div>{selectedProject.student_email || 'No email'}</div>
                    {selectedProject.student_phone && (
                      <div>📞 {selectedProject.student_phone}</div>
                    )}
                  </div>
                </div>
                
                <div className="detail-group">
                  <label>Status</label>
                  <div className="detail-value">
                    {getProjectStatusBadge(selectedProject.status)}
                  </div>
                </div>
                
                <div className="detail-group">
                  <label>Category</label>
                  <div className="detail-value">
                    <span className="category-badge">
                      {selectedProject.category || 'Uncategorized'}
                    </span>
                  </div>
                </div>
                
                <div className="detail-group">
                  <label>Funding Goal</label>
                  <div className="detail-value">
                    {selectedProject.funding_goals ? (
                      <span className="funding-amount">
                        ₨ {parseFloat(selectedProject.funding_goals).toLocaleString()}
                      </span>
                    ) : (
                      'Not specified'
                    )}
                  </div>
                </div>
                
                <div className="detail-group">
                  <label>Timeline</label>
                  <div className="detail-value">
                    {selectedProject.timeline ? `${selectedProject.timeline} weeks` : 'Not specified'}
                  </div>
                </div>
                
                <div className="detail-group full-width">
                  <label>Description</label>
                  <div className="detail-value description-text">
                    {selectedProject.description || 'No description provided'}
                  </div>
                </div>
                
                {selectedProject.technologies && (
                  <div className="detail-group">
                    <label>Technologies</label>
                    <div className="detail-value">
                      {selectedProject.technologies}
                    </div>
                  </div>
                )}
                
                {selectedProject.university_name && (
                  <div className="detail-group">
                    <label>University</label>
                    <div className="detail-value">
                      {selectedProject.university_name}
                    </div>
                  </div>
                )}
                
                {selectedProject.file_path && (
                  <div className="detail-group full-width">
                    <label>Project File</label>
                    <div className="detail-value">
                      <div className="files-list-modal">
                        <div className="file-item-modal">
                          <a 
                            href={`http://localhost:5000/uploads/${selectedProject.file_path}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="file-link-modal"
                          >
                            📄 {selectedProject.file_name || `project_${selectedProject.id}.pdf`}
                          </a>
                          {selectedProject.file_size && (
                            <span className="file-size-modal">
                              ({(selectedProject.file_size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          )}
                          <span className="file-upload-date">
                            Uploaded: {formatDate(selectedProject.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedProject.admin_notes && (
                  <div className="detail-group full-width">
                    <label>Admin Notes</label>
                    <div className="detail-value admin-notes">
                      {selectedProject.admin_notes}
                    </div>
                  </div>
                )}
                
                <div className="detail-group">
                  <label>Created</label>
                  <div className="detail-value">
                    {formatDate(selectedProject.created_at)}
                  </div>
                </div>
                
                <div className="detail-group">
                  <label>Last Updated</label>
                  <div className="detail-value">
                    {formatDate(selectedProject.updated_at || selectedProject.created_at)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowProjectViewModal(false)}
              >
                Close
              </button>
              <button 
                className="btn-primary"
                onClick={() => {
                  setShowProjectViewModal(false);
                  openProjectEditModal(selectedProject);
                }}
              >
                ✏️ Edit Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROJECT EDIT MODAL */}
      {showProjectEditModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowProjectEditModal(false)}>
          <div className="modal wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Project: {selectedProject.title}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowProjectEditModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  placeholder="Project title"
                  value={projectForm.title}
                  onChange={e => setProjectForm({ ...projectForm, title: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  placeholder="Project description"
                  value={projectForm.description}
                  onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                  required
                  rows="4"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={projectForm.category}
                    onChange={e => setProjectForm({ ...projectForm, category: e.target.value })}
                    required
                  >
                    <option value="">Select category</option>
                    <option value="web-development">Web Development</option>
                    <option value="mobile-app">Mobile Application</option>
                    <option value="ai-ml">AI & Machine Learning</option>
                    <option value="blockchain">Blockchain</option>
                    <option value="iot">Internet of Things</option>
                    <option value="data-science">Data Science</option>
                    <option value="cybersecurity">Cybersecurity</option>
                    <option value="robotics">Robotics</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Technologies</label>
                  <input
                    type="text"
                    placeholder="e.g., React, Node.js, Python"
                    value={projectForm.technologies}
                    onChange={e => setProjectForm({ ...projectForm, technologies: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>University Name</label>
                  <input
                    type="text"
                    placeholder="University/Institution"
                    value={projectForm.university_name}
                    onChange={e => setProjectForm({ ...projectForm, university_name: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label>Funding Goal (₨)</label>
                  <input
                    type="text"
                    placeholder="Enter funding goal"
                    value={projectForm.funding_goals}
                    onChange={e => setProjectForm({...projectForm, funding_goals: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Timeline (weeks)</label>
                  <input
                    type="number"
                    placeholder="Project timeline"
                    value={projectForm.timeline}
                    onChange={e => setProjectForm({ ...projectForm, timeline: e.target.value })}
                    min="1"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Admin Notes</label>
                <textarea
                  placeholder="Internal notes for administrators"
                  value={projectForm.admin_notes}
                  onChange={e => setProjectForm({ ...projectForm, admin_notes: e.target.value })}
                  rows="3"
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowProjectEditModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleUpdateProject}
                disabled={!projectForm.title || !projectForm.description || !projectForm.category}
              >
                Update Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS CHANGE MODAL */}
      {showStatusModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Project Status</h3>
              <button 
                className="close-btn"
                onClick={() => setShowStatusModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Current Status</label>
                <div className="current-status-display">
                  {getProjectStatusBadge(selectedProject.status)}
                </div>
              </div>
              
              <div className="form-group">
                <label>New Status *</label>
                <select
                  value={statusForm.status}
                  onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}
                  required
                >
                  <option value="pending">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Admin Notes (Optional)</label>
                <textarea
                  placeholder="Reason for status change or additional notes"
                  value={statusForm.admin_notes}
                  onChange={e => setStatusForm({ ...statusForm, admin_notes: e.target.value })}
                  rows="3"
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleUpdateStatus}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL MODAL */}
      {showApprovalModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
          <div className="modal wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Review Edit Request</h3>
              <button 
                className="close-btn"
                onClick={() => setShowApprovalModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="approval-details">
                <div className="detail-row">
                  <label>Request ID:</label>
                  <span>#{selectedRequest.id}</span>
                </div>
                <div className="detail-row">
                  <label>Student:</label>
                  <span>{selectedRequest.student_name} ({selectedRequest.student_email})</span>
                </div>
                <div className="detail-row">
                  <label>Project:</label>
                  <span>{selectedRequest.project_title || 'General Edit'}</span>
                </div>
                <div className="detail-row">
                  <label>Request Type:</label>
                  <span>{selectedRequest.request_type}</span>
                </div>
                <div className="detail-row">
                  <label>Submitted:</label>
                  <span>{formatDate(selectedRequest.created_at)}</span>
                </div>
                
                <div className="change-section">
                  <h4>Change Details:</h4>
                  <div className="change-boxes">
                    <div className="change-box">
                      <h5>Current Data:</h5>
                      <pre>{JSON.stringify(parseJSON(selectedRequest.current_data), null, 2)}</pre>
                    </div>
                    <div className="change-box">
                      <h5>Requested Changes:</h5>
                      <pre>{JSON.stringify(parseJSON(selectedRequest.requested_changes), null, 2)}</pre>
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Decision *</label>
                  <select
                    value={approvalForm.status}
                    onChange={e => setApprovalForm({ ...approvalForm, status: e.target.value })}
                    required
                  >
                    <option value="approved">Approve</option>
                    <option value="rejected">Reject</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Admin Notes</label>
                  <textarea
                    placeholder="Reason for your decision..."
                    value={approvalForm.admin_notes}
                    onChange={e => setApprovalForm({ ...approvalForm, admin_notes: e.target.value })}
                    rows="3"
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowApprovalModal(false)}
              >
                Cancel
              </button>
              <button 
                className={`btn-primary ${approvalForm.status === 'rejected' ? 'reject' : 'approve'}`}
                onClick={handleApprovalDecision}
              >
                {approvalForm.status === 'rejected' ? 'Reject Request' : 'Approve Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMMENT DELETE MODAL */}
      {showCommentModal && selectedComment && (
        <div className="modal-overlay" onClick={() => setShowCommentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Comment</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCommentModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="comment-preview">
                <p><strong>Comment by:</strong> {selectedComment.user_name}</p>
                <p><strong>Date:</strong> {formatDate(selectedComment.created_at)}</p>
                <div className="comment-content-preview">
                  <p>{selectedComment.content}</p>
                </div>
              </div>
              
              <div className="form-group">
                <label>Reason for Deletion *</label>
                <select
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Inappropriate content">Inappropriate content</option>
                  <option value="Spam or advertising">Spam or advertising</option>
                  <option value="Harassment or bullying">Harassment or bullying</option>
                  <option value="Off-topic discussion">Off-topic discussion</option>
                  <option value="Misinformation">Misinformation</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              {deleteReason === 'Other' && (
                <div className="form-group">
                  <label>Specify Reason</label>
                  <input
                    type="text"
                    placeholder="Enter reason for deletion"
                    value={deleteReason === 'Other' ? deleteReason : ''}
                    onChange={e => setDeleteReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowCommentModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary delete"
                onClick={handleDeleteComment}
                disabled={!deleteReason.trim()}
              >
                Delete Comment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP NOTIFICATION */}
      {popup.show && (
        <div className={`popup-notification ${popup.error ? 'error' : 'success'}`}>
          <p>{popup.msg}</p>
        </div>
      )}

      {/* CSS STYLES */}
      <style>
        {`
          .header-actions {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-left: auto;
          }

          .refresh-btn-icon {
            background: transparent;
            color: #555;
            border: 1px solid #ddd;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
            font-size: 0.95rem;
            background: white;
          }

          .refresh-btn-icon:hover {
            background: #f5f5f5;
            border-color: #ccc;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }

          .refresh-btn-icon:active {
            transform: translateY(0);
          }
          
          .projects-grid-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
            margin-top: 20px;
          }

          .project-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: 1px solid #e0e0e0;
            display: flex;
            flex-direction: column;
            height: 100%;
          }

          .project-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          }

          .project-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          .project-card-title-section {
            flex: 1;
          }

          .project-title {
            margin: 0 0 10px 0;
            font-size: 1.2rem;
            font-weight: 600;
            line-height: 1.4;
          }

          .project-meta {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .project-id {
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
          }

          .project-category {
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
          }

          .project-status-section {
            margin-left: 10px;
          }

          .project-card-body {
            padding: 20px;
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          .project-description {
            margin-bottom: 20px;
            color: #555;
            line-height: 1.6;
            flex-shrink: 0;
          }

          .project-description p {
            margin: 0;
          }

          .project-info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 20px;
            flex: 1;
          }

          .info-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .info-label {
            font-weight: 600;
            color: #666;
            font-size: 0.85rem;
          }

          .info-value {
            color: #333;
            font-size: 0.95rem;
            word-break: break-word;
          }

          .project-card-footer {
            padding: 20px;
            background: #f8f9fa;
            border-top: 1px solid #e0e0e0;
          }

          .card-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }

          .card-actions .btn-action {
            flex: 1;
            min-width: 120px;
            padding: 10px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: all 0.2s ease;
            font-size: 0.9rem;
          }

          .btn-action.view {
            background: #4CAF50;
            color: white;
          }

          .btn-action.edit {
            background: #2196F3;
            color: white;
          }

          .btn-action.status {
            background: #FF9800;
            color: white;
          }

          .btn-action.delete {
            background: #F44336;
            color: white;
          }

          .btn-action.approve {
            background: #4CAF50;
            color: white;
          }

          .btn-action.reject {
            background: #F44336;
            color: white;
          }

          .btn-action:hover {
            opacity: 0.9;
            transform: translateY(-2px);
          }

          .btn-action:active {
            transform: translateY(0);
          }

          .section-header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 20px;
          }

          .project-stats-summary {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
          }

          .stat-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 500;
            font-size: 0.9rem;
          }

          .stat-badge.pending {
            background: #FFF3E0;
            color: #E65100;
          }

          .stat-badge.approved {
            background: #E8F5E9;
            color: #2E7D32;
          }

          .stat-badge.rejected {
            background: #FFEBEE;
            color: #C62828;
          }

          .stat-label {
            font-weight: 600;
          }

          .stat-value {
            font-weight: 700;
            font-size: 1.1rem;
          }

          .nav-badge {
            background: #F44336;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.7rem;
            margin-left: 8px;
          }

          .stat-card.red {
            background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);
            color: white;
          }

          .stat-card.teal {
            background: linear-gradient(135deg, #26A69A 0%, #4DB6AC 100%);
            color: white;
          }

          .delete-confirmation-message {
            text-align: center;
            padding: 20px;
          }

          .warning-icon {
            font-size: 48px;
            margin-bottom: 15px;
            color: #FF9800;
          }

          .user-to-delete {
            font-size: 1.2rem;
            color: #F44336;
            margin: 10px 0;
            padding: 10px;
            background: #FFEBEE;
            border-radius: 8px;
            border: 1px solid #FFCDD2;
          }

          .warning-text {
            color: #F44336;
            font-weight: 500;
            margin-top: 15px;
          }

          .btn-primary.delete {
            background: #F44336;
          }

          .btn-primary.delete:hover {
            background: #D32F2F;
          }

          .approvals-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 20px;
            margin-top: 20px;
          }

          .approval-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #e0e0e0;
            transition: transform 0.3s ease;
          }

          .approval-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          }

          .approval-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 15px;
            background: #f5f7fa;
            border-bottom: 1px solid #e0e0e0;
          }

          .approval-header h3 {
            margin: 0 0 8px 0;
            font-size: 1.1rem;
            color: #333;
          }

          .approval-meta {
            display: flex;
            gap: 10px;
            font-size: 0.85rem;
            color: #666;
          }

          .approval-type {
            background: #e3f2fd;
            padding: 2px 8px;
            border-radius: 4px;
            color: #1976d2;
          }

          .approval-date {
            color: #666;
          }

          .approval-status {
            margin-left: 10px;
          }

          .approval-body {
            padding: 15px;
          }

          .request-details {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .student-info {
            font-size: 0.9rem;
            color: #555;
          }

          .change-comparison {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 10px;
          }

          .change-comparison h4 {
            margin: 0 0 8px 0;
            font-size: 0.9rem;
            color: #333;
          }

          .change-comparison pre {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 6px;
            font-size: 0.8rem;
            max-height: 150px;
            overflow-y: auto;
            margin: 0;
            white-space: pre-wrap;
            word-break: break-word;
          }

          .approval-actions {
            padding: 15px;
            border-top: 1px solid #e0e0e0;
            background: #f8f9fa;
          }

          .approval-actions .btn-action {
            width: 100%;
          }

          .community-stats {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
          }

          .community-stats .stat-badge {
            background: #e3f2fd;
            color: #1976d2;
          }

          .community-posts {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .community-post-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #e0e0e0;
          }

          .post-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: #f5f7fa;
            border-bottom: 1px solid #e0e0e0;
          }

          .post-author {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .author-avatar {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
          }

          .author-info {
            display: flex;
            flex-direction: column;
          }

          .author-info strong {
            font-size: 0.95rem;
          }

          .author-info span {
            font-size: 0.8rem;
            color: #666;
          }

          .post-meta {
            display: flex;
            gap: 10px;
            align-items: center;
          }

          .post-category {
            background: #e3f2fd;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            color: #1976d2;
          }

          .post-date {
            font-size: 0.8rem;
            color: #666;
          }

          .post-content {
            padding: 15px;
          }

          .post-content h4 {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 1.1rem;
          }

          .post-content p {
            margin: 0;
            color: #555;
            line-height: 1.6;
          }

          .post-actions {
            padding: 15px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            gap: 10px;
          }

          .post-comments {
            border-top: 1px solid #e0e0e0;
            padding: 15px;
            background: #f8f9fa;
          }

          .post-comments h5 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 1rem;
          }

          .comment-item {
            background: white;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 10px;
            border: 1px solid #e0e0e0;
          }

          .comment-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }

          .comment-author {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .comment-avatar {
            width: 30px;
            height: 30px;
            background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: bold;
          }

          .comment-author-info {
            display: flex;
            flex-direction: column;
          }

          .comment-author-info strong {
            font-size: 0.85rem;
          }

          .comment-author-info span {
            font-size: 0.75rem;
            color: #666;
          }

          .comment-content {
            margin: 10px 0;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 6px;
          }

          .comment-content p {
            margin: 0;
            font-size: 0.9rem;
            color: #444;
          }

          .comment-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
          }

          .comment-actions .btn-action {
            padding: 6px 12px;
            font-size: 0.8rem;
            min-width: auto;
          }

          .approval-details {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }

          .detail-row label {
            font-weight: 600;
            color: #555;
          }

          .detail-row span {
            color: #333;
          }

          .change-section {
            margin-top: 15px;
          }

          .change-section h4 {
            margin: 0 0 10px 0;
            color: #333;
          }

          .change-boxes {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }

          .change-box {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
          }

          .change-box h5 {
            margin: 0 0 8px 0;
            color: #333;
            font-size: 0.9rem;
          }

          .change-box pre {
            margin: 0;
            font-size: 0.8rem;
            white-space: pre-wrap;
            word-break: break-word;
            max-height: 150px;
            overflow-y: auto;
          }

          .comment-preview {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
          }

          .comment-preview p {
            margin: 5px 0;
          }

          .comment-content-preview {
            margin-top: 10px;
            padding: 10px;
            background: white;
            border-radius: 6px;
            border-left: 3px solid #4CAF50;
          }

          .comment-content-preview p {
            margin: 0;
            font-style: italic;
          }

          .btn-primary.approve {
            background: #4CAF50;
          }

          .btn-primary.reject {
            background: #F44336;
          }

          .btn-primary.delete {
            background: #F44336;
          }

          @media (max-width: 768px) {
            .header-actions {
              flex-direction: column;
              width: 100%;
              margin-top: 10px;
            }
            
            .refresh-btn, .primary-btn {
              width: 100%;
            }
            
            .projects-grid-container,
            .approvals-grid {
              grid-template-columns: 1fr;
            }
            
            .change-comparison,
            .change-boxes {
              grid-template-columns: 1fr;
            }
            
            .post-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 10px;
            }
            
            .post-meta {
              flex-wrap: wrap;
            }
            
            .card-actions,
            .comment-actions {
              flex-direction: column;
            }
            
            .card-actions .btn-action {
              min-width: 100%;
            }
          }
        `}
      </style>
    </div>
  );
}