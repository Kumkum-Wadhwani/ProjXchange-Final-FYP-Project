import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import API from '../api/api';

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Chart components
const PieChart = ({ data, colors }) => {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  let accumulated = 0;

  return (
    <div className="pie-chart">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {Object.entries(data).map(([status, value], index) => {
          if (value === 0) return null;
          const percentage = (value / total) * 100;
          const offset = (accumulated / total) * 100;
          accumulated += value;

          return (
            <circle
              key={status}
              cx="60"
              cy="60"
              r="50"
              fill="transparent"
              stroke={colors[status] || '#666'}
              strokeWidth="20"
              strokeDasharray={`${percentage} ${100 - percentage}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
            />
          );
        })}
      </svg>
      <div className="pie-center">
        <div className="pie-total">{total}</div>
        <div className="pie-label">Projects</div>
      </div>
    </div>
  );
};

const StarRating = ({ rating }) => {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={star <= rating ? 'star filled' : 'star'}
        >
          {star <= rating ? '★' : '☆'}
        </span>
      ))}
      <span className="rating-text">({rating.toFixed(1)})</span>
    </div>
  );
};

export default function StudentDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: '',
    technologies: '',
    university_name: '',
    funding_goal: '',
    timeline: '',
    proposal_file: null
  });
  const [uploadStatus, setUploadStatus] = useState('');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    cnic: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cnicStatus, setCnicStatus] = useState('');
  
  // Posts & Comments States
  const [communityPosts, setCommunityPosts] = useState([]);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'general'
  });
  const [postComments, setPostComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [postLoading, setPostLoading] = useState(false);
  
  // Delete confirmation states
  const [showDeletePostModal, setShowDeletePostModal] = useState(false);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [commentToDelete, setCommentToDelete] = useState(null);

  // Edit request states
  const [showEditRequestModal, setShowEditRequestModal] = useState(false);
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState(null);
  const [editRequestForm, setEditRequestForm] = useState({
    title: '',
    description: '',
    category: '',
    technologies: '',
    university_name: '',
    funding_goal: '',
    timeline: '',
    reason: '',
    proposal_file: null
  });
  const [editRequestStatus, setEditRequestStatus] = useState('');
  const [editRequestFile, setEditRequestFile] = useState(null);

  // Bids Received States
  const [bidsReceived, setBidsReceived] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(false);

  // Bid Action Confirmation Modal State
  const [showBidConfirmModal, setShowBidConfirmModal] = useState(false);
  const [pendingBidAction, setPendingBidAction] = useState({ bidId: null, status: '' });

  // Deliverables (Files) Management
  const [showDeliverablesModal, setShowDeliverablesModal] = useState(false);
  const [selectedBidForFiles, setSelectedBidForFiles] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDescription, setFileDescription] = useState('');
  const [deliverablesLoading, setDeliverablesLoading] = useState(false);

  // ========== NEW: Payment Confirmation States ==========
  const [pendingConfirmations, setPendingConfirmations] = useState([]);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [popup, setPopup] = useState({ show: false, msg: "", error: false });
  const navigate = useNavigate();

  const showPopup = (msg, error = false) => {
    setPopup({ show: true, msg, error });
    setTimeout(() => setPopup({ show: false, msg: "", error: false }), 3000);
  };

  const updateGlobalUserData = (updatedUserData) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const newUserData = {
      ...currentUser,
      ...updatedUserData
    };
    
    localStorage.setItem('user', JSON.stringify(newUserData));
    Object.assign(user, updatedUserData);
    
    setProfileData(prev => ({
      ...prev,
      name: updatedUserData.name || prev.name,
      phone: updatedUserData.phone || prev.phone,
      cnic: updatedUserData.cnic || prev.cnic
    }));
    
    return newUserData;
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    
    setProfileData({
      name: parsedUser?.name || '',
      email: parsedUser?.email || '',
      phone: parsedUser?.phone || '',
      cnic: parsedUser?.cnic || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    if (parsedUser?.cnic && !user.cnic) {
      user.cnic = parsedUser.cnic;
    }

    loadDashboardData();
    loadMyProjects();
    
    if (activeTab === 'community') {
      loadCommunityPosts();
    }

    if (activeTab === 'bids-received') {
      loadBidsReceived();
    }

    if (activeTab === 'confirm-payments') {
      loadPendingConfirmations();
    }
  }, [user, navigate, activeTab]);

  useEffect(() => {
    if (activeTab !== 'upload') {
      setUploadStatus('');
    }
  }, [activeTab]);

  const loadCommunityPosts = async () => {
    try {
      setPostLoading(true);
      const response = await API.get('/posts/student/community');
      if (response.data.success) {
        setCommunityPosts(response.data.posts);
      }
    } catch (error) {
      console.error('Error loading community posts:', error);
      showPopup('Failed to load community posts', true);
    } finally {
      setPostLoading(false);
    }
  };

  const loadBidsReceived = async () => {
    try {
      setBidsLoading(true);
      const response = await API.get('/projects/student/bids-received');
      if (response.data.success) {
        setBidsReceived(response.data.bids);
      } else {
        showPopup(response.data.message || 'Failed to load bids', true);
      }
    } catch (error) {
      console.error('Error loading bids received:', error);
      showPopup('Failed to load bids received', true);
    } finally {
      setBidsLoading(false);
    }
  };

  // ========== NEW: Load pending payment confirmations ==========
  const loadPendingConfirmations = async () => {
    try {
      const res = await API.get('/payments/student/pending-confirmations');
      setPendingConfirmations(res.data.payments || []);
    } catch (error) {
      console.error('Error loading pending confirmations:', error);
      showPopup('Failed to load pending confirmations', true);
    }
  };

  // ========== NEW: Confirm payment receipt ==========
  const handleConfirmReceipt = async (paymentId) => {
    setConfirmLoading(true);
    try {
      const res = await API.post(`/payments/confirm-receipt/${paymentId}`);
      if (res.data.success) {
        showPopup('Payment confirmed successfully!', false);
        loadPendingConfirmations(); // refresh list
      } else {
        showPopup(res.data.message || 'Failed to confirm', true);
      }
    } catch (error) {
      console.error('Confirmation error:', error);
      showPopup(error.response?.data?.message || 'Error confirming receipt', true);
    } finally {
      setConfirmLoading(false);
    }
  };

  // Deliverables functions
  const openDeliverablesModal = async (bid) => {
    setSelectedBidForFiles(bid);
    setDeliverablesLoading(true);
    try {
      const res = await API.get(`/deliverables/student/bid/${bid.id}/files`);
      setDeliverables(res.data.deliverables || []);
      setShowDeliverablesModal(true);
    } catch (error) {
      console.error('Error loading deliverables:', error);
      showPopup('Failed to load files', true);
    } finally {
      setDeliverablesLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      showPopup('Please select a file', true);
      return;
    }
    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('description', fileDescription);
    try {
      await API.post(`/deliverables/student/bid/${selectedBidForFiles.id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showPopup('File uploaded successfully', false);
      setSelectedFile(null);
      setFileDescription('');
      const res = await API.get(`/deliverables/student/bid/${selectedBidForFiles.id}/files`);
      setDeliverables(res.data.deliverables || []);
    } catch (error) {
      console.error('Upload error:', error);
      showPopup(error.response?.data?.message || 'Upload failed', true);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteDeliverable = async (deliverableId) => {
    if (!window.confirm('Delete this file? This action cannot be undone.')) return;
    try {
      await API.delete(`/deliverables/student/file/${deliverableId}`);
      showPopup('File deleted', false);
      const res = await API.get(`/deliverables/student/bid/${selectedBidForFiles.id}/files`);
      setDeliverables(res.data.deliverables || []);
    } catch (error) {
      console.error('Delete error:', error);
      showPopup('Delete failed', true);
    }
  };

  const confirmBidAction = (bidId, status) => {
    setPendingBidAction({ bidId, status });
    setShowBidConfirmModal(true);
  };

  const executeBidAction = async () => {
    const { bidId, status } = pendingBidAction;
    if (!bidId) return;
    
    try {
      const response = await API.patch(`/projects/student/bid/${bidId}/status`, { status });
      if (response.data.success) {
        showPopup(response.data.message);
        loadBidsReceived();
      } else {
        showPopup(response.data.message || `Failed to ${status} bid`, true);
      }
    } catch (error) {
      console.error('Error updating bid status:', error);
      showPopup(error.response?.data?.message || 'Error updating bid status', true);
    } finally {
      setShowBidConfirmModal(false);
      setPendingBidAction({ bidId: null, status: '' });
    }
  };

  const loadPostComments = async (postId) => {
    try {
      const response = await API.get(`/comments/post/${postId}`);
      if (response.data.success) {
        setPostComments(prev => ({
          ...prev,
          [postId]: response.data.comments
        }));
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    
    try {
      const response = await API.delete(`/posts/${postToDelete.id}`);
      
      if (response.data.success) {
        showPopup('✅ Post deleted successfully');
        setShowDeletePostModal(false);
        setPostToDelete(null);
        loadCommunityPosts();
      } else {
        showPopup(response.data.message || 'Failed to delete post', true);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      showPopup(error.response?.data?.message || 'Failed to delete post', true);
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    
    try {
      const response = await API.delete(`/comments/${commentToDelete.id}`);
      
      if (response.data.success) {
        showPopup('✅ Comment deleted successfully');
        setShowDeleteCommentModal(false);
        setCommentToDelete(null);
        if (commentToDelete.post_id) {
          loadPostComments(commentToDelete.post_id);
        }
      } else {
        showPopup(response.data.message || 'Failed to delete comment', true);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      showPopup(error.response?.data?.message || 'Failed to delete comment', true);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await API.get('/projects/dashboard-stats');

      const realData = {
        stats: {
          total_projects: response.data.stats?.total_projects || 0,
          total_views: 0,
          total_interests: 0,
          average_rating: response.data.stats?.average_rating || 0
        },
        projectStatus: response.data.projectStatus || {},
        insights: generateRealInsights(response.data.stats?.total_projects || 0)
      };

      setDashboardData(realData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDashboardData({
        stats: {
          total_projects: 0,
          total_views: 0,
          total_interests: 0,
          average_rating: 0
        },
        projectStatus: {},
        insights: generateRealInsights(0)
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRealInsights = (totalProjects) => {
    const insights = [];

    if (totalProjects === 0) {
      insights.push("Upload your first project to get started!");
      insights.push("Complete your profile to increase visibility");
      insights.push("Projects in Web Development category are trending");
    } else if (totalProjects === 1) {
      insights.push("Great! You've uploaded your first project");
      insights.push("Your project is now pending admin approval");
      insights.push("Add detailed descriptions to attract more attention");
    } else if (totalProjects < 3) {
      insights.push(`You have ${totalProjects} projects uploaded`);
      insights.push("Consider diversifying your project categories");
      insights.push("All projects are currently awaiting admin review");
    } else {
      insights.push(`You have ${totalProjects} active projects`);
      insights.push("Keep maintaining your project portfolio");
      insights.push("Projects are automatically submitted for admin review");
    }

    return insights;
  };

  const loadMyProjects = async () => {
    try {
      const response = await API.get('/projects/me');
      
      const projectsWithFiles = response.data.projects?.map(project => ({
        ...project,
        file_name: project.file_name || `project_${project.id}.pdf`,
        file_size: project.file_size || project.proposal_file?.size || 0,
        file_url: project.file_url || project.proposal_file?.url || `/api/projects/${project.id}/file`,
        category_display: project.category ? 
          project.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
          'Uncategorized'
      })) || [];
      
      setProjects(projectsWithFiles);
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    if (onLogout) onLogout();
    navigate('/');
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    if (!newPost.title.trim() || !newPost.content.trim()) {
      showPopup('Please fill in both title and content', true);
      return;
    }

    try {
      const response = await API.post('/posts', newPost);
      
      if (response.data.success) {
        showPopup('Post submitted successfully! Waiting for admin approval.');
        setShowCreatePostModal(false);
        setNewPost({ title: '', content: '', category: 'general' });
        loadCommunityPosts();
      } else {
        showPopup(response.data.message || 'Failed to create post', true);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      showPopup(error.response?.data?.message || 'Failed to create post', true);
    }
  };

  const handleAddComment = async (postId) => {
    if (!newComment.trim()) {
      showPopup('Please enter a comment', true);
      return;
    }

    try {
      const response = await API.post(`/comments/post/${postId}`, {
        content: newComment
      });

      if (response.data.success) {
        showPopup('Comment submitted! Waiting for admin approval.');
        setNewComment('');
        loadPostComments(postId);
      } else {
        showPopup(response.data.message || 'Failed to add comment', true);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      showPopup(error.response?.data?.message || 'Failed to add comment', true);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setUploadStatus('Error: Only PDF files are allowed for project proposals.');
        return;
      }

      if (file.size > 1000 * 1024 * 1024) {
        setUploadStatus('Error: File size must be less than 1000MB.');
        return;
      }

      setUploadData(prev => ({ ...prev, proposal_file: file }));
      setUploadStatus('PDF file selected: ' + file.name);
    }
  };

  const handleInputChange = (e) => {
    setUploadData({
      ...uploadData,
      [e.target.name]: e.target.value
    });
  };

  const openEditRequestModal = (project) => {
    setSelectedProjectForEdit(project);
    setEditRequestForm({
      title: project.title || '',
      description: project.description || '',
      category: project.category || '',
      technologies: project.technologies || '',
      university_name: project.university_name || '',
      funding_goal: project.funding_goal || project.funding_goals || '',
      timeline: project.timeline || '',
      reason: '',
      proposal_file: null
    });
    setEditRequestFile(null);
    setEditRequestStatus('');
    setShowEditRequestModal(true);
  };

  const handleEditRequestChange = (e) => {
    setEditRequestForm({
      ...editRequestForm,
      [e.target.name]: e.target.value
    });
  };

  const handleEditRequestFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setEditRequestStatus('Error: Only PDF files are allowed for project proposals.');
        return;
      }

      if (file.size > 1000 * 1024 * 1024) {
        setEditRequestStatus('Error: File size must be less than 1000MB.');
        return;
      }

      setEditRequestFile(file);
      setEditRequestStatus('PDF file selected: ' + file.name);
    }
  };

  const submitEditRequest = async (e) => {
    e.preventDefault();
    
    if (!selectedProjectForEdit) return;

    const changes = {};
    if (editRequestForm.title !== selectedProjectForEdit.title) changes.title = editRequestForm.title;
    if (editRequestForm.description !== selectedProjectForEdit.description) changes.description = editRequestForm.description;
    if (editRequestForm.category !== selectedProjectForEdit.category) changes.category = editRequestForm.category;
    if (editRequestForm.technologies !== selectedProjectForEdit.technologies) changes.technologies = editRequestForm.technologies;
    if (editRequestForm.university_name !== selectedProjectForEdit.university_name) changes.university_name = editRequestForm.university_name;
    if (editRequestForm.funding_goal !== selectedProjectForEdit.funding_goal) changes.funding_goal = editRequestForm.funding_goal;
    if (editRequestForm.timeline !== selectedProjectForEdit.timeline) changes.timeline = editRequestForm.timeline;

    if (Object.keys(changes).length === 0 && !editRequestFile) {
      setEditRequestStatus('Error: No changes detected. Please make some changes or upload a new file.');
      return;
    }

    if (!editRequestForm.reason.trim()) {
      setEditRequestStatus('Error: Please provide a reason for the edit request.');
      return;
    }

    setEditRequestStatus('Submitting edit request...');

    try {
      const formData = new FormData();
      formData.append('project_id', selectedProjectForEdit.id);
      formData.append('title', editRequestForm.title);
      formData.append('description', editRequestForm.description);
      formData.append('category', editRequestForm.category);
      formData.append('technologies', editRequestForm.technologies);
      formData.append('university_name', editRequestForm.university_name);
      formData.append('funding_goal', editRequestForm.funding_goal);
      formData.append('timeline', editRequestForm.timeline);
      formData.append('reason', editRequestForm.reason);
      
      if (editRequestFile) {
        formData.append('proposal_file', editRequestFile);
      }

      const response = await API.post('/projects/edit-request', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        showPopup('✅ Edit request submitted successfully! Admin will review it soon.');
        setShowEditRequestModal(false);
        setSelectedProjectForEdit(null);
        setEditRequestForm({
          title: '',
          description: '',
          category: '',
          technologies: '',
          university_name: '',
          funding_goal: '',
          timeline: '',
          reason: '',
          proposal_file: null
        });
        setEditRequestFile(null);
      } else {
        setEditRequestStatus('Error: ' + (response.data.message || 'Failed to submit edit request'));
      }
    } catch (error) {
      console.error('Edit request error:', error);
      setEditRequestStatus('Error: ' + (error.response?.data?.message || 'Failed to submit edit request'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!uploadData.title || !uploadData.description || !uploadData.category) {
      setUploadStatus('Error: Please fill all required fields (Title, Description, Category)');
      return;
    }

    if (!uploadData.proposal_file) {
      setUploadStatus('Error: Please upload a PDF proposal file');
      return;
    }

    setUploadStatus('Uploading project...');

    try {
      const formData = new FormData();
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('category', uploadData.category);
      formData.append('technologies', uploadData.technologies);
      formData.append('university_name', uploadData.university_name);
      formData.append('funding_goal', uploadData.funding_goal);
      formData.append('timeline', uploadData.timeline);
      formData.append('proposal_file', uploadData.proposal_file);

      const response = await API.post('/projects', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000
      });

      if (response.data.project) {
        setUploadStatus('Project uploaded successfully! It is now pending admin approval.');

        setTimeout(() => {
          setUploadStatus('');
        }, 3000);

        setUploadData({
          title: '',
          description: '',
          category: '',
          technologies: '',
          university_name: '',
          funding_goal: '',
          timeline: '',
          proposal_file: null
        });

        const fileInput = document.getElementById('proposal_file');
        if (fileInput) fileInput.value = '';

        await loadDashboardData();
        await loadMyProjects();

        setTimeout(() => {
          setActiveTab('projects');
        }, 2000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Upload failed. Please try again.';

      setUploadStatus(`Error: ${errorMessage}`);
    }
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cnic') {
      let formattedValue = value.replace(/\D/g, '');
      
      if (formattedValue.length === 13) {
        formattedValue = `${formattedValue.slice(0, 5)}-${formattedValue.slice(5, 12)}-${formattedValue.slice(12)}`;
      }
      
      setProfileData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
      return;
    }
    
    setProfileData({
      ...profileData,
      [name]: value
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      showPopup('❌ New passwords do not match', true);
      return;
    }

    if (profileData.newPassword && !profileData.currentPassword) {
      showPopup('❌ Current password is required', true);
      return;
    }

    if (profileData.cnic && !/^[0-9]{5}-[0-9]{7}-[0-9]{1}$|^[0-9]{13}$/.test(profileData.cnic)) {
      showPopup('❌ Invalid CNIC format. Use: 12345-1234567-1 or 13 digits', true);
      return;
    }

    showPopup('⏳ Updating profile...', false);
    setCnicStatus('Saving...');

    try {
      const updatePayload = {
        name: profileData.name,
        phone: profileData.phone || '',
        cnic: profileData.cnic || ''
      };

      if (profileData.newPassword) {
        updatePayload.currentPassword = profileData.currentPassword;
        updatePayload.newPassword = profileData.newPassword;
      }

      const response = await API.put('/auth/update-profile', updatePayload);

      if (response.data.success && response.data.user) {
        const updatedUserData = response.data.user;
        
        if (!updatedUserData.cnic && profileData.cnic) {
          updatedUserData.cnic = profileData.cnic;
        }
        
        updateGlobalUserData(updatedUserData);
        
        showPopup('Profile updated successfully!', false);
        setCnicStatus('Saved!');
        
        setIsEditingProfile(false);
        
        setProfileData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));

        setTimeout(() => {
          setCnicStatus('');
        }, 2000);

      } else {
        const errorMsg = response.data.message || 'Failed to update profile';
        showPopup(`❌ ${errorMsg}`, true);
        setCnicStatus('Error saving');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMsg = error.response?.data?.message || 'Update failed. Please try again.';
      showPopup(`❌ ${errorMsg}`, true);
      setCnicStatus('Error saving');
    }
  };

  const handleCancelEdit = () => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    setProfileData({
      name: userData?.name || '',
      email: userData?.email || '',
      phone: userData?.phone || '',
      cnic: userData?.cnic || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsEditingProfile(false);
    setCnicStatus('');
  };

  if (!user) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const statusColors = {
    pending: '#ffb74d',
    approved: '#4caf50',
    rejected: '#f44336',
    draft: '#9e9e9e'
  };

  const getPostStatusBadge = (status) => {
    const colors = {
      pending_review: '#FF9800',
      approved: '#4CAF50',
      rejected: '#F44336'
    };
    
    return (
      <span className="post-status-badge" style={{ 
        backgroundColor: colors[status] || '#666',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: '500'
      }}>
        {status === 'pending_review' ? 'Pending Review' : 
         status === 'approved' ? 'Approved' : 'Rejected'}
      </span>
    );
  };

  const getCommentStatusBadge = (status) => {
    const colors = {
      pending_review: '#FF9800',
      approved: '#4CAF50',
      rejected: '#F44336'
    };
    
    return (
      <span className="comment-status-badge" style={{ 
        backgroundColor: colors[status] || '#666',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '8px',
        fontSize: '0.7rem',
        fontWeight: '500'
      }}>
        {status === 'pending_review' ? 'Pending' : 
         status === 'approved' ? 'Approved' : 'Rejected'}
      </span>
    );
  };

  return (
    <div className="dashboard">
      {/* Sidebar Navigation – added new tab "Confirm Payments" */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-name">ProjXchange</span>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">Student</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </div>
          <div className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
            <span className="nav-icon">📁</span>
            <span className="nav-text">My Projects</span>
          </div>
          <div className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
            <span className="nav-icon">📤</span>
            <span className="nav-text">Upload Project</span>
          </div>
          <div className={`nav-item ${activeTab === 'bids-received' ? 'active' : ''}`} onClick={() => { setActiveTab('bids-received'); loadBidsReceived(); }}>
            <span className="nav-icon">💰</span>
            <span className="nav-text">Bids Received</span>
          </div>
          <div className={`nav-item ${activeTab === 'community' ? 'active' : ''}`} onClick={() => { setActiveTab('community'); loadCommunityPosts(); }}>
            <span className="nav-icon">💬</span>
            <span className="nav-text">Error-Solving Community</span>
          </div>
          {/* NEW TAB: Confirm Payments */}
          <div className={`nav-item ${activeTab === 'confirm-payments' ? 'active' : ''}`} onClick={() => { setActiveTab('confirm-payments'); loadPendingConfirmations(); }}>
            <span className="nav-icon">✅</span>
            <span className="nav-text">Confirm Payments</span>
          </div>
          <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <span className="nav-icon">👤</span>
            <span className="nav-text">Profile</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <span className="logout-icon">🚪</span>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="page-title">
              {activeTab === 'dashboard' && 'Student Dashboard'}
              {activeTab === 'projects' && 'My Projects'}
              {activeTab === 'upload' && 'Upload Project'}
              {activeTab === 'bids-received' && 'Bids Received'}
              {activeTab === 'community' && 'Error-Solving Community'}
              {activeTab === 'confirm-payments' && 'Confirm Payment Receipts'}
              {activeTab === 'profile' && 'My Profile'}
            </h1>
            <p className="welcome-message">
              Welcome back, {user.name}! 👋
            </p>
          </div>
          <div className="header-right">
            <div className="notification-bell">🔔</div>
            <div className="user-avatar-small" onClick={() => setActiveTab('profile')}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* DASHBOARD TAB – unchanged */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-overview">
              {loading ? <div className="loading-spinner"></div> : (
                <>
                  <div className="stats-grid">
                    <div className="stat-card"><div className="stat-icon">📊</div><div className="stat-info"><div className="stat-number">{dashboardData?.stats?.total_projects || 0}</div><div className="stat-label">Total Projects</div></div></div>
                    <div className="stat-card"><div className="stat-icon">⏳</div><div className="stat-info"><div className="stat-number">{dashboardData?.projectStatus?.pending || 0}</div><div className="stat-label">Pending Review</div></div></div>
                    <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-info"><div className="stat-number">{dashboardData?.projectStatus?.approved || 0}</div><div className="stat-label">Approved</div></div></div>
                    <div className="stat-card"><div className="stat-icon">⭐</div><div className="stat-info"><StarRating rating={dashboardData?.stats?.average_rating || 0} /><div className="stat-label">Average Rating</div></div></div>
                  </div>
                  <div className="visualization-grid">
                    <div className="chart-card"><h3>Project Status Distribution</h3><div className="chart-content"><PieChart data={dashboardData?.projectStatus || {}} colors={statusColors} /><div className="chart-legend">{Object.entries(dashboardData?.projectStatus || {}).map(([status, count]) => (<div key={status} className="legend-item"><span className="legend-color" style={{ backgroundColor: statusColors[status] }}></span><span className="legend-text">{status.charAt(0).toUpperCase() + status.slice(1)}: {count}</span></div>))}</div></div></div>
                    <div className="insights-card"><h3>Project Insights</h3><div className="insights-content">{dashboardData?.insights?.map((insight, index) => (<div key={index} className="insight-item"><span className="insight-bullet">•</span><span className="insight-text">{insight}</span></div>))}</div></div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* MY PROJECTS TAB – unchanged */}
          {activeTab === 'projects' && (
            <div className="projects-section">
              <div className="projects-header"><h2>My Projects ({projects.length})</h2><button onClick={() => setActiveTab('upload')} className="upload-new-btn">+ Upload New Project</button></div>
              {projects.length === 0 ? (<div className="no-projects"><div className="no-projects-icon">📁</div><h3>No projects yet</h3><p>Start by uploading your first project proposal</p><button onClick={() => setActiveTab('upload')} className="cta-button">Upload Your First Project</button></div>) : (
                <div className="projects-grid">
                  {projects.map(project => (
                    <div key={project.id} className="project-card">
                      <div className="project-header"><div className="project-title-section"><h3>{project.title}</h3><div className={`project-status ${project.status}`}>{project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : 'Draft'}</div></div><div className="project-actions"><button className="edit-request-btn" onClick={() => openEditRequestModal(project)}>✏️ Request Edit</button></div></div>
                      <p className="project-description">{project.description || 'No description provided'}</p>
                      <div className="project-meta"><span className="project-category">{project.category_display || 'Uncategorized'}</span><span className="project-date">{new Date(project.created_at).toLocaleDateString()}</span></div>
                      <div className="project-file-display"><div className="file-header"><span className="file-icon">📄</span><strong>Proposal PDF:</strong></div><div className="file-info"><span className="file-name">{project.file_name || `project_${project.id}.pdf`}</span>{project.file_size > 0 && <span className="file-size">({formatFileSize(project.file_size)})</span>}</div><div className="file-actions"><a href={`http://localhost:5000/uploads/${project.file_path}`} target="_blank" rel="noopener noreferrer">View PDF</a><a href={`http://localhost:5000/uploads/${project.file_path}`} download={project.file_name} className="download-pdf-btn">⬇ Download</a></div></div>
                      {project.technologies && <div className="project-technologies"><strong>Technologies:</strong> {project.technologies}</div>}
                      {project.university_name && <div className="project-university"><strong>University:</strong> {project.university_name}</div>}
                      {project.funding_goal && <div className="project-funding"><strong>Funding Goal:</strong> ${parseFloat(project.funding_goal).toLocaleString()}</div>}
                      {project.timeline && <div className="project-timeline"><strong>Timeline:</strong> {project.timeline} weeks</div>}
                      <div className="project-stats"><span className="stat">Status: <span className={`status-badge ${project.status}`}>{project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : 'Pending'}</span></span><span className="stat">Uploaded: {new Date(project.created_at).toLocaleDateString()}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* UPLOAD PROJECT TAB – unchanged */}
          {activeTab === 'upload' && (
            <div className="upload-section">
              <div className="upload-container"><h2>Upload Project Proposal</h2><p className="upload-subtitle">Submit your project proposal with PDF documentation</p>
                <form onSubmit={handleSubmit} className="upload-form">
                  <div className="form-group"><label htmlFor="title">Project Title *</label><input type="text" id="title" name="title" placeholder="Enter your project title" value={uploadData.title} onChange={handleInputChange} required className="form-input" /></div>
                  <div className="form-group"><label htmlFor="description">Project Description *</label><textarea id="description" name="description" placeholder="Describe your project in detail" value={uploadData.description} onChange={handleInputChange} required className="form-textarea" rows="5" /></div>
                  <div className="form-group"><label htmlFor="category">Project Category *</label><select id="category" name="category" value={uploadData.category} onChange={handleInputChange} required className="form-select"><option value="">Select a category</option><option value="web-development">Web Development</option><option value="mobile-app">Mobile Application</option><option value="ai-ml">AI & Machine Learning</option><option value="blockchain">Blockchain</option><option value="iot">Internet of Things</option><option value="data-science">Data Science</option><option value="cybersecurity">Cybersecurity</option><option value="robotics">Robotics</option><option value="other">Other</option></select></div>
                  <div className="form-group"><label htmlFor="technologies">Technologies Used</label><input type="text" id="technologies" name="technologies" placeholder="e.g., React, Node.js" value={uploadData.technologies} onChange={handleInputChange} className="form-input" /></div>
                  <div className="form-group"><label htmlFor="university_name">University/Institution</label><input type="text" id="university_name" name="university_name" placeholder="Your university" value={uploadData.university_name} onChange={handleInputChange} className="form-input" /></div>
                  <div className="form-group"><label htmlFor="funding_goal">Funding Goal ($)</label><input type="number" id="funding_goal" name="funding_goal" placeholder="Estimated funding" value={uploadData.funding_goal} onChange={handleInputChange} className="form-input" min="0" /></div>
                  <div className="form-group"><label htmlFor="timeline">Project Timeline (Weeks)</label><input type="number" id="timeline" name="timeline" placeholder="Timeline in weeks" value={uploadData.timeline} onChange={handleInputChange} className="form-input" min="1" /></div>
                  <div className="form-group"><label htmlFor="proposal_file">Project Proposal (PDF Only) *</label><div className="file-upload-area"><input type="file" id="proposal_file" name="proposal_file" accept=".pdf" onChange={handleFileChange} className="file-input" required /><div className={`file-upload-box ${uploadData.proposal_file ? 'has-file' : ''}`}><div className="upload-icon">📄</div><div className="upload-text">{uploadData.proposal_file ? uploadData.proposal_file.name : 'Click to upload PDF proposal'}</div><div className="upload-hint">Maximum file size: 1000MB • PDF files only</div></div></div></div>
                  {uploadStatus && <div className={`upload-status ${uploadStatus.includes('successfully') ? 'success' : 'error'}`}>{uploadStatus}</div>}
                  <button type="submit" className="upload-submit-btn" disabled={!uploadData.title || !uploadData.description || !uploadData.category || !uploadData.proposal_file}>📤 Upload Project Proposal</button>
                </form>
              </div>
            </div>
          )}

          {/* BIDS RECEIVED TAB – unchanged */}
          {activeTab === 'bids-received' && (
            <div className="bids-received-section">
              <div className="section-header"><h2>Bids Received on Your Projects</h2><p>Here are all the bids that investors have placed on your projects. You can accept or reject pending bids. For approved bids, you can upload files (code, documents, zip) for the investor.</p></div>
              {bidsLoading ? <div className="loading-spinner"></div> : bidsReceived.length === 0 ? (
                <div className="no-data"><div className="no-data-icon">💰</div><h3>No bids yet</h3><p>When investors place bids on your projects, they will appear here.</p></div>
              ) : (
                <div className="bids-table-container">
                  <table className="bids-table">
                    <thead><tr><th>Project</th><th>Investor</th><th>Amount</th><th>Message</th><th>Date</th><th>Status</th><th>Actions</th><th>Files</th></tr></thead>
                    <tbody>
                      {bidsReceived.map((bid) => (
                        <tr key={bid.id}>
                          <td><strong>{bid.project_title}</strong></td>
                          <td>{bid.investor_name}<br/><small className="investor-email">{bid.investor_email}</small></td>
                          <td>${bid.amount}</td>
                          <td>{bid.message || '—'}</td>
                          <td>{new Date(bid.created_at).toLocaleDateString()}</td>
                          <td><span className="bid-status-badge" style={{backgroundColor: bid.status === 'approved' ? '#4caf50' : bid.status === 'pending' ? '#ff9800' : '#f44336'}}>{bid.status}</span></td>
                          <td>
                            {bid.status === 'pending' ? (
                              <div className="bid-actions">
                                <button className="btn-action approve" onClick={() => confirmBidAction(bid.id, 'approved')}>Accept</button>
                                <button className="btn-action reject" onClick={() => confirmBidAction(bid.id, 'rejected')}>Reject</button>
                              </div>
                            ) : (
                              <span className="no-action">—</span>
                            )}
                           </td>
                          <td>
                            {bid.status && bid.status.toLowerCase() === 'approved' && (
                              <button className="btn-outline btn-sm" onClick={() => openDeliverablesModal(bid)}>📁 Manage Files</button>
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

          {/* COMMUNITY TAB – unchanged */}
          {activeTab === 'community' && (
            <div className="community-section">
              <div className="community-header"><h2>Error-Solving Community</h2><p>Ask questions, share solutions, and collaborate with other students</p><button className="create-post-btn" onClick={() => setShowCreatePostModal(true)}>+ Create New Post</button></div>
              {postLoading ? (<div className="loading-spinner"></div>) : communityPosts.length === 0 ? (<div className="no-posts"><div className="no-posts-icon">💬</div><h3>No posts yet</h3><p>Be the first to start a discussion!</p><button className="cta-button" onClick={() => setShowCreatePostModal(true)}>Create Your First Post</button></div>) : (
                <div className="posts-grid">
                  {communityPosts.map(post => (
                    <div key={post.id} className="post-card">
                      <div className="post-header"><div className="post-title-section"><h3>{post.title}</h3><div className="post-meta"><span className="post-author">By: {post.user_name}</span><span className="post-date">{new Date(post.created_at).toLocaleDateString()}</span>{getPostStatusBadge(post.status)}</div></div><div className="post-category">{post.category || 'General'}</div></div>
                      <div className="post-content"><p>{post.content}</p></div>
                      {post.user_id === user.id && (<div className="post-actions"><button className="delete-post-btn" onClick={() => { setPostToDelete(post); setShowDeletePostModal(true); }}>🗑️ Delete Post</button></div>)}
                      <div className="post-comments-section">
                        <div className="comments-header"><h4>Comments ({post.comment_count || 0})<button className="load-comments-btn" onClick={() => { if (!postComments[post.id]) loadPostComments(post.id); }}>{postComments[post.id] ? 'Hide Comments' : 'Show Comments'}</button></h4>{post.status === 'approved' && post.user_id !== user.id && (<div className="add-comment-form"><textarea placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="comment-input" rows="2" /><button className="submit-comment-btn" onClick={() => handleAddComment(post.id)}>Submit Comment</button></div>)}</div>
                        {postComments[post.id] && (<div className="comments-list">{postComments[post.id].map(comment => (<div key={comment.id} className="comment-item"><div className="comment-header"><div className="comment-author-info"><span className="comment-author">{comment.user_name}</span><span className="comment-date">{new Date(comment.created_at).toLocaleDateString()}</span></div><div className="comment-header-right">{getCommentStatusBadge(comment.status)}{comment.user_id === user.id && (<button className="delete-comment-btn" onClick={() => { setCommentToDelete(comment); setShowDeleteCommentModal(true); }}>🗑️</button>)}</div></div><div className="comment-content"><p>{comment.content}</p></div>{comment.status !== 'approved' && (<div className="comment-note"><small>{comment.status === 'pending_review' ? 'Waiting for admin approval' : 'Comment rejected by admin'}</small></div>)}</div>))}</div>)}
                        {post.status === 'pending_review' && post.user_id === user.id && (<div className="post-pending-notice"><p>⏳ Your post is pending admin approval. It will be visible to others once approved.</p></div>)}
                        {post.status === 'rejected' && post.user_id === user.id && (<div className="post-rejected-notice"><p>❌ Your post was rejected by admin. You can create a new one.</p></div>)}
                        {post.status === 'approved' && post.user_id === user.id && (<div className="post-owned-notice"><p>✅ Your post is live! Other students can comment on it.</p></div>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== NEW: CONFIRM PAYMENTS TAB ========== */}
          {/* ========== NEW: CONFIRM PAYMENTS TAB ========== */}
{/* ========== CONFIRM PAYMENTS TAB (PKR) ========== */}
{activeTab === 'confirm-payments' && (
  <div className="confirm-payments-section">
    <div className="section-header">
      <h2>Confirm Payment Receipts</h2>
      <p>Please confirm that you have received the following payments. Once you click "OK", the investor will be able to download your project files.</p>
    </div>
    {pendingConfirmations.length === 0 ? (
      <div className="no-data">
        <div className="no-data-icon">✅</div>
        <h3>No pending confirmations</h3>
        <p>All your received payments have been confirmed.</p>
      </div>
    ) : (
      <div className="confirmations-list">
        {pendingConfirmations.map(payment => (
          <div key={payment.id} className="confirmation-card">
            <div className="confirmation-details">
              <strong className="project-title">{payment.project_title}</strong>
              <p><span className="label">Amount:</span> {payment.formatted_amount || `₨ ${payment.amount}`}</p>
              <p><span className="label">From:</span> {payment.investor_name} ({payment.investor_email})</p>
              <p><span className="label">Date:</span> {new Date(payment.created_at).toLocaleString()}</p>
            </div>
            <button 
              onClick={() => handleConfirmReceipt(payment.id)}
              className="btn-success"
              disabled={confirmLoading}
            >
              ✅ OK - I have received this payment
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
)}
          {/* PROFILE TAB – unchanged */}
          {activeTab === 'profile' && (
            <div className="profile-section">
              <div className="profile-header"><h2>My Profile</h2>{!isEditingProfile && <button onClick={() => setIsEditingProfile(true)} className="edit-profile-btn">✏️ Edit Profile</button>}</div>
              {!isEditingProfile ? (
                <div className="profile-view">
                  <div className="profile-avatar-large"><div className="avatar-circle">{user.name.charAt(0).toUpperCase()}</div><div className="avatar-info"><h3>{user.name}</h3></div></div>
                  <div className="profile-details">
                    <div className="detail-card"><div className="detail-icon">📧</div><div className="detail-content"><label>Email Address</label><span>{user.email}</span></div></div>
                    <div className="detail-card"><div className="detail-icon">📱</div><div className="detail-content"><label>Phone Number</label><span>{user.phone || 'Not provided'}</span></div></div>
                    <div className="detail-card"><div className="detail-icon">🆔</div><div className="detail-content"><label>CNIC Number</label><span>{user.cnic || 'Not provided'}</span></div></div>
                    <div className="detail-card"><div className="detail-icon">👤</div><div className="detail-content"><label>Account Type</label><span className="account-type-text">Student Account</span></div></div>
                    <div className="detail-card"><div className="detail-icon">📅</div><div className="detail-content"><label>Member Since</label><span>{new Date(user.created_at || Date.now()).toLocaleDateString()}</span></div></div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className="profile-edit-form">
                  <div className="form-section"><h3>Personal Information</h3>
                    <div className="form-group"><label>Full Name *</label><input type="text" name="name" value={profileData.name} onChange={handleProfileInputChange} required className="form-input" /></div>
                    <div className="form-group"><label>Email Address</label><input type="email" value={profileData.email} disabled className="form-input disabled" /><small className="form-hint">Email cannot be changed</small></div>
                    <div className="form-group"><label>Phone Number</label><input type="tel" name="phone" value={profileData.phone} onChange={handleProfileInputChange} className="form-input" /></div>
                    <div className="form-group"><label>CNIC Number</label><input type="text" name="cnic" value={profileData.cnic || ''} onChange={handleProfileInputChange} className="form-input" maxLength="15" placeholder="e.g., 42201-3149927-8" /><small className="form-hint">Format: 12345-1234567-1 (13 digits with dashes)</small></div>
                  </div>
                  <div className="form-section"><h3>Change Password (Optional)</h3><p className="section-hint">Leave blank if you don't want to change your password</p>
                    <div className="form-group"><label>Current Password</label><input type="password" name="currentPassword" value={profileData.currentPassword} onChange={handleProfileInputChange} className="form-input" /></div>
                    <div className="form-group"><label>New Password</label><input type="password" name="newPassword" value={profileData.newPassword} onChange={handleProfileInputChange} className="form-input" minLength="6" /></div>
                    <div className="form-group"><label>Confirm New Password</label><input type="password" name="confirmPassword" value={profileData.confirmPassword} onChange={handleProfileInputChange} className="form-input" /></div>
                  </div>
                  <div className="form-actions"><button type="submit" className="save-btn">💾 Save Changes</button><button type="button" onClick={handleCancelEdit} className="cancel-btn">❌ Cancel</button></div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODALS – all remain unchanged except the new tab content already added */}

      {/* EDIT REQUEST MODAL – unchanged */}
      {showEditRequestModal && selectedProjectForEdit && (
        <div className="modal-overlay" onClick={() => setShowEditRequestModal(false)}>
          <div className="modal wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Request Project Edits</h3><p className="modal-subtitle">Request changes to: <strong>{selectedProjectForEdit.title}</strong></p><button className="close-btn" onClick={() => setShowEditRequestModal(false)}>×</button></div>
            <div className="modal-body"><div className="form-note"><p>⚠️ <strong>Note:</strong> All edit requests require admin approval.</p></div>
              <form onSubmit={submitEditRequest} className="edit-request-form">
                <div className="form-group"><label>Project Title</label><input type="text" name="title" value={editRequestForm.title} onChange={handleEditRequestChange} className="form-input" /></div>
                <div className="form-group"><label>Project Description</label><textarea name="description" value={editRequestForm.description} onChange={handleEditRequestChange} className="form-textarea" rows="4" /></div>
                <div className="form-row"><div className="form-group"><label>Category</label><select name="category" value={editRequestForm.category} onChange={handleEditRequestChange} className="form-select"><option value="">Select</option><option value="web-development">Web Development</option><option value="mobile-app">Mobile App</option><option value="ai-ml">AI/ML</option><option value="blockchain">Blockchain</option><option value="iot">IoT</option><option value="data-science">Data Science</option><option value="cybersecurity">Cybersecurity</option><option value="other">Other</option></select></div><div className="form-group"><label>Technologies</label><input type="text" name="technologies" value={editRequestForm.technologies} onChange={handleEditRequestChange} className="form-input" /></div></div>
                <div className="form-row"><div className="form-group"><label>University</label><input type="text" name="university_name" value={editRequestForm.university_name} onChange={handleEditRequestChange} className="form-input" /></div><div className="form-group"><label>Funding Goal ($)</label><input type="number" name="funding_goal" value={editRequestForm.funding_goal} onChange={handleEditRequestChange} className="form-input" min="0" /></div></div>
                <div className="form-group"><label>Timeline (Weeks)</label><input type="number" name="timeline" value={editRequestForm.timeline} onChange={handleEditRequestChange} className="form-input" min="1" /></div>
                <div className="form-group"><label>Updated Proposal PDF (Optional)</label><div className="file-upload-area"><input type="file" accept=".pdf" onChange={handleEditRequestFileChange} className="file-input" /><div className={`file-upload-box ${editRequestFile ? 'has-file' : ''}`}><div className="upload-icon">📄</div><div className="upload-text">{editRequestFile ? editRequestFile.name : 'Click to upload updated PDF (optional)'}</div></div></div><small className="form-hint">Upload if you want to update the proposal file.</small></div>
                <div className="form-group"><label>Reason for Changes *</label><textarea name="reason" value={editRequestForm.reason} onChange={handleEditRequestChange} placeholder="Explain why you want to make these changes..." className="form-textarea" rows="3" required /></div>
                {editRequestStatus && <div className={`edit-request-status ${editRequestStatus.includes('Error') ? 'error' : 'info'}`}>{editRequestStatus}</div>}
                <div className="modal-actions"><button type="button" className="btn-secondary" onClick={() => setShowEditRequestModal(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={!editRequestForm.reason.trim()}>📤 Submit Edit Request</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CREATE POST MODAL – unchanged */}
      {showCreatePostModal && (
        <div className="modal-overlay" onClick={() => setShowCreatePostModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Create New Post</h3><button className="close-btn" onClick={() => setShowCreatePostModal(false)}>×</button></div>
            <div className="modal-body"><form onSubmit={handleCreatePost}><div className="form-group"><label>Title *</label><input type="text" value={newPost.title} onChange={(e) => setNewPost({...newPost, title: e.target.value})} required className="form-input" /></div><div className="form-group"><label>Category</label><select value={newPost.category} onChange={(e) => setNewPost({...newPost, category: e.target.value})} className="form-select"><option value="general">General</option><option value="technical">Technical Issues</option><option value="academic">Academic Questions</option><option value="project">Project Help</option><option value="career">Career Advice</option></select></div><div className="form-group"><label>Content *</label><textarea value={newPost.content} onChange={(e) => setNewPost({...newPost, content: e.target.value})} required className="form-textarea" rows="6" /></div><div className="modal-actions"><button type="button" className="btn-secondary" onClick={() => setShowCreatePostModal(false)}>Cancel</button><button type="submit" className="btn-primary">Submit Post</button></div></form></div>
          </div>
        </div>
      )}

      {/* DELETE POST MODAL – unchanged */}
      {showDeletePostModal && postToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeletePostModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Delete Post</h3><button className="close-btn" onClick={() => setShowDeletePostModal(false)}>×</button></div>
            <div className="modal-body"><div className="delete-confirmation"><p>Are you sure you want to delete this post?</p><div className="post-preview"><strong>{postToDelete.title}</strong><p>{postToDelete.content.substring(0, 100)}...</p></div><p className="warning-text">This action cannot be undone.</p></div><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowDeletePostModal(false)}>Cancel</button><button className="btn-primary delete" onClick={handleDeletePost}>Delete Post</button></div></div>
          </div>
        </div>
      )}

      {/* DELETE COMMENT MODAL – unchanged */}
      {showDeleteCommentModal && commentToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteCommentModal(false)}>
          <div className="modal small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Delete Comment</h3><button className="close-btn" onClick={() => setShowDeleteCommentModal(false)}>×</button></div>
            <div className="modal-body"><div className="delete-confirmation"><p>Are you sure you want to delete this comment?</p><div className="comment-preview"><p>{commentToDelete.content.substring(0, 150)}...</p></div><p className="warning-text">This action cannot be undone.</p></div><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowDeleteCommentModal(false)}>Cancel</button><button className="btn-primary delete" onClick={handleDeleteComment}>Delete Comment</button></div></div>
          </div>
        </div>
      )}

      {/* BID ACTION CONFIRMATION MODAL – unchanged */}
      {showBidConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowBidConfirmModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Confirm Bid Action</h3><button onClick={() => setShowBidConfirmModal(false)} className="close-btn">×</button></div>
            <div className="modal-body"><p>Are you sure you want to <strong>{pendingBidAction.status}</strong> this bid?</p><p className="warning-text">This action cannot be undone.</p></div>
            <div className="modal-actions"><button onClick={() => setShowBidConfirmModal(false)} className="btn-secondary">Cancel</button><button onClick={executeBidAction} className={`btn-primary ${pendingBidAction.status === 'approved' ? 'approve' : 'reject'}`}>Yes, {pendingBidAction.status}</button></div>
          </div>
        </div>
      )}

      {/* DELIVERABLES MODAL – unchanged */}
      {showDeliverablesModal && selectedBidForFiles && (
        <div className="modal-overlay" onClick={() => setShowDeliverablesModal(false)}>
          <div className="modal wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Manage Project Files</h3>
              <button className="close-btn" onClick={() => setShowDeliverablesModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>Project:</strong> {selectedBidForFiles.project_title}</p>
              <p><strong>Investor:</strong> {selectedBidForFiles.investor_name}</p>
              <div className="upload-section" style={{ marginBottom: '20px' }}>
                <h4>Upload New File</h4>
                <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} accept=".zip,.pdf,.doc,.docx,.txt,.py,.js,.html,.css,.json,.xml" />
                <textarea placeholder="Description (optional)" value={fileDescription} onChange={(e) => setFileDescription(e.target.value)} rows="2" className="form-textarea" style={{ marginTop: '10px' }} />
                <button className="btn-primary" onClick={handleFileUpload} disabled={uploadingFile} style={{ marginTop: '10px' }}>{uploadingFile ? 'Uploading...' : 'Upload File'}</button>
              </div>
              <div className="files-list">
                <h4>Uploaded Files</h4>
                {deliverablesLoading ? <p>Loading...</p> : deliverables.length === 0 ? <p>No files uploaded yet.</p> : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {deliverables.map(file => (
                      <li key={file.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><strong>{file.file_name}</strong> ({(file.file_size / 1024 / 1024).toFixed(2)} MB)<br/>{file.description && <small>{file.description}</small>}</div>
                        <button className="btn-danger btn-sm" onClick={() => handleDeleteDeliverable(file.id)}>Delete</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeliverablesModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP NOTIFICATION – unchanged */}
      {popup.show && (
        <div className={`popup-notification ${popup.error ? 'error' : 'success'}`}>
          <div className="popup-content"><span className="popup-icon">{popup.error ? '❌' : popup.msg.includes('⏳') ? '⏳' : '✅'}</span><span className="popup-message">{popup.msg}</span></div>
        </div>
      )}
      
      {/* Add CSS for new Confirm Payments tab */}
      <style>{`
        /* Confirm Payments Tab Styles */
        .confirm-payments-section {
          padding: 20px;
        }
        .confirm-payments-section .section-header {
          margin-bottom: 25px;
        }
        .confirm-payments-section .section-header h2 {
          color: #333;
          font-size: 1.8rem;
          margin-bottom: 10px;
        }
        .confirm-payments-section .section-header p {
          color: #666;
          font-size: 1rem;
        }
        .confirmations-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .confirmation-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border-left: 4px solid #4caf50;
          transition: transform 0.2s;
        }
        .confirmation-card:hover {
          transform: translateX(4px);
        }
        .confirmation-details {
          flex: 1;
        }
        .confirmation-details .project-title {
          font-size: 1.2rem;
          color: #2d6374;
          margin-bottom: 8px;
          display: inline-block;
        }
        .confirmation-details p {
          margin: 6px 0;
          color: #555;
        }
        .confirmation-details .label {
          font-weight: 600;
          color: #333;
          margin-right: 8px;
        }
        .btn-success {
          background: #4caf50;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.2s;
          white-space: nowrap;
          margin-left: 20px;
        }
        .btn-success:hover {
          background: #45a049;
          transform: scale(1.02);
        }
        .btn-success:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        @media (max-width: 768px) {
          .confirmation-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          .btn-success {
            margin-left: 0;
            width: 100%;
            text-align: center;
          }
        }
        
        /* all previous styles from the original StudentDashboard remain */
        /* (the rest of the CSS is exactly as in your original file – it's kept intact) */
        .bids-received-section {
          padding: 20px;
        }
        .bids-received-section .section-header {
          margin-bottom: 25px;
        }
        .bids-received-section .section-header h2 {
          color: #333;
          font-size: 1.8rem;
          margin-bottom: 10px;
        }
        .bids-received-section .section-header p {
          color: #666;
          font-size: 1rem;
        }
        .bids-table-container {
          background: white;
          border-radius: 12px;
          overflow-x: auto;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .bids-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        .bids-table th {
          background: #f8f9fa;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          color: #555;
          border-bottom: 2px solid #e0e0e0;
        }
        .bids-table td {
          padding: 15px;
          border-bottom: 1px solid #eee;
          vertical-align: top;
        }
        .bids-table tr:hover {
          background: #fafafa;
        }
        .investor-email {
          color: #888;
          font-size: 0.8rem;
        }
        .bid-status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          color: white;
          text-transform: capitalize;
        }
        .bid-actions {
          display: flex;
          gap: 8px;
        }
        .btn-action.approve {
          background: #4caf50;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .btn-action.approve:hover {
          background: #45a049;
        }
        .btn-action.reject {
          background: #f44336;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .btn-action.reject:hover {
          background: #d32f2f;
        }
        .no-action {
          color: #999;
        }
        .no-data {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .no-data-icon {
          font-size: 4rem;
          margin-bottom: 20px;
          display: block;
          color: #ddd;
        }
        .no-data h3 {
          margin: 0 0 10px;
          color: #666;
        }
        .no-data p {
          color: #999;
        }
        /* Community Section Styles */
        .community-section {
          padding: 20px;
        }
        .community-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px;
          border-radius: 12px;
          margin-bottom: 30px;
        }
        .community-header h2 {
          margin: 0 0 10px 0;
          font-size: 2rem;
        }
        .community-header p {
          margin: 0 0 20px 0;
          opacity: 0.9;
        }
        .create-post-btn {
          background: white;
          color: #667eea;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        .create-post-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .posts-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .post-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          padding: 25px;
          border: 1px solid #e0e0e0;
        }
        .post-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
          flex-wrap: wrap;
          gap: 15px;
        }
        .post-title-section h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 1.3rem;
        }
        .post-meta {
          display: flex;
          gap: 15px;
          align-items: center;
          flex-wrap: wrap;
        }
        .post-author {
          color: #666;
          font-size: 0.9rem;
        }
        .post-date {
          color: #999;
          font-size: 0.85rem;
        }
        .post-category {
          background: #e3f2fd;
          color: #1976d2;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
        }
        .post-content {
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .post-content p {
          margin: 0;
          line-height: 1.6;
          color: #555;
        }
        .post-actions {
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }
        .delete-post-btn {
          background: #f44336;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .delete-post-btn:hover {
          background: #d32f2f;
        }
        .post-comments-section {
          margin-top: 20px;
        }
        .comments-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .comments-header h4 {
          margin: 0;
          color: #333;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .load-comments-btn {
          background: #f5f5f5;
          border: 1px solid #ddd;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .load-comments-btn:hover {
          background: #e0e0e0;
        }
        .add-comment-form {
          flex: 1;
          display: flex;
          gap: 10px;
          max-width: 500px;
        }
        .comment-input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-family: inherit;
          resize: vertical;
        }
        .comment-input:focus {
          outline: none;
          border-color: #4CAF50;
        }
        .submit-comment-btn {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        .submit-comment-btn:hover {
          background: #45a049;
        }
        .comments-list {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
          margin-top: 15px;
        }
        .comment-item {
          background: white;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 10px;
          border: 1px solid #e0e0e0;
        }
        .comment-item:last-child {
          margin-bottom: 0;
        }
        .comment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .comment-author-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .comment-author {
          font-weight: 600;
          color: #333;
        }
        .comment-date {
          color: #999;
          font-size: 0.85rem;
        }
        .comment-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .delete-comment-btn {
          background: #f44336;
          color: white;
          border: none;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .delete-comment-btn:hover {
          background: #d32f2f;
          transform: scale(1.1);
        }
        .comment-content p {
          margin: 0;
          line-height: 1.5;
          color: #444;
        }
        .comment-note {
          margin-top: 8px;
          padding: 8px;
          background: #fff3e0;
          border-radius: 4px;
          border-left: 3px solid #ff9800;
        }
        .comment-note small {
          color: #e65100;
        }
        .post-pending-notice, .post-rejected-notice, .post-owned-notice {
          margin-top: 15px;
          padding: 12px;
          border-radius: 8px;
          font-weight: 500;
        }
        .post-pending-notice {
          background: #fff3e0;
          color: #e65100;
          border: 1px solid #ffb74d;
        }
        .post-rejected-notice {
          background: #ffebee;
          color: #c62828;
          border: 1px solid #ef9a9a;
        }
        .post-owned-notice {
          background: #e8f5e9;
          color: #2e7d32;
          border: 1px solid #a5d6a7;
        }
        .no-posts {
          text-align: center;
          padding: 60px 20px;
        }
        .no-posts-icon {
          font-size: 4rem;
          margin-bottom: 20px;
          display: block;
          color: #ddd;
        }
        .no-posts h3 {
          margin: 0 0 10px 0;
          color: #666;
        }
        .no-posts p {
          margin: 0 0 20px 0;
          color: #999;
        }
        .post-status-badge, .comment-status-badge {
          display: inline-block;
        }
        .delete-confirmation {
          text-align: center;
          padding: 20px 0;
        }
        .delete-confirmation p {
          margin: 0 0 15px 0;
          font-size: 1.1rem;
          color: #333;
        }
        .post-preview, .comment-preview {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          border-left: 4px solid #f44336;
        }
        .post-preview strong {
          display: block;
          margin-bottom: 8px;
          color: #333;
        }
        .post-preview p, .comment-preview p {
          margin: 0;
          color: #666;
          font-style: italic;
        }
        .warning-text {
          color: #f44336 !important;
          font-weight: 600;
        }
        .modal.small {
          max-width: 400px;
        }
        .btn-primary.delete {
          background: #f44336;
        }
        .btn-primary.delete:hover {
          background: #d32f2f;
        }
        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }
        .btn-primary {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        .btn-secondary {
          background: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        .btn-primary:hover {
          background: #45a049;
        }
        .btn-secondary:hover {
          background: #e0e0e0;
        }
        .popup-notification {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 9999;
          animation: slideUp 0.3s ease;
          max-width: 300px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          border: 1px solid rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .popup-notification.success {
          background: #4CAF50;
          color: white;
          border-left: 4px solid #2E7D32;
        }
        .popup-notification.error {
          background: #F44336;
          color: white;
          border-left: 4px solid #C62828;
        }
        .popup-notification.info {
          background: #2196F3;
          color: white;
          border-left: 4px solid #1976D2;
        }
        .popup-content {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
        }
        .popup-icon {
          font-size: 18px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }
        .popup-message {
          font-size: 14px;
          font-weight: 500;
          line-height: 1.4;
          flex: 1;
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @media (max-width: 768px) {
          .post-header {
            flex-direction: column;
          }
          .comments-header {
            flex-direction: column;
            align-items: stretch;
          }
          .add-comment-form {
            flex-direction: column;
          }
          .comment-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .comment-header-right {
            margin-top: 8px;
            align-self: flex-end;
          }
          .popup-notification {
            bottom: 10px;
            right: 10px;
            left: 10px;
            max-width: calc(100% - 20px);
          }
          .bid-actions {
            flex-direction: column;
          }
          .bids-table th,
          .bids-table td {
            padding: 10px;
          }
        }
      `}</style>
    </div>
  );
}