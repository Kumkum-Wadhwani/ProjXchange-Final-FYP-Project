import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./PostsPage.css";

const PostsPage = ({ user, onLogout }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token || !user) {
      navigate("/login");
      return;
    }

    fetchPosts();
  }, [user, navigate]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem("token");
      
      const response = await fetch('http://localhost:5000/api/posts/student/community', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success === true) {
          setPosts(data.posts || []);
        } else {
          setError("Failed to load posts");
          setPosts([]);
        }
      } else {
        setError(`Error: ${response.status} ${response.statusText}`);
        setPosts([]);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts. Please check your connection.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    if (onLogout) onLogout();
    navigate('/');
  };

  // Helper function to get status badge - SIMPLIFIED VERSION
  const getStatusBadge = (status) => {
    const statusConfig = {
      'approved': {
        bgColor: '#4CAF50',
        color: 'white',
        icon: '✓'
      },
      'pending_review': {
        bgColor: '#FF9800',
        color: 'white',
        icon: '⏳'
      },
      'rejected': {
        bgColor: '#F44336',
        color: 'white',
        icon: '✗'
      }
    };
    
    const config = statusConfig[status] || {
      bgColor: '#666',
      color: 'white',
      icon: '?'
    };
    
    return (
      <span className="status-badge" style={{
        backgroundColor: config.bgColor,
        color: config.color,
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '0.8rem',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '24px',
        height: '24px'
      }}>
        {config.icon}
      </span>
    );
  };

  // Get category badge
  const getCategoryBadge = (category) => {
    if (!category) return null;
    
    const formattedCategory = category
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    return (
      <span className="category-badge" style={{
        backgroundColor: '#E3F2FD',
        color: '#1565C0',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: '500'
      }}>
        {formattedCategory}
      </span>
    );
  };

  // Calculate post statistics - ONLY CURRENT USER'S POSTS
  const getPostStats = () => {
    // Filter posts to only show current user's posts
    const userPosts = posts.filter(post => post.user_id === user.id);
    
    const total = userPosts.length;
    const approved = userPosts.filter(p => p.status === 'approved').length;
    const pending = userPosts.filter(p => p.status === 'pending_review').length;
    const rejected = userPosts.filter(p => p.status === 'rejected').length;
    
    return { total, approved, pending, rejected };
  };

  const stats = getPostStats();

  return (
    <div className="dashboard">
      {/* Sidebar Navigation */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-name">ProjXchange</span>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role">Student</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item" onClick={() => navigate('/student/dashboard')}>
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </div>

          <div className="nav-item" onClick={() => navigate('/student/dashboard')}>
            <span className="nav-icon">📁</span>
            <span className="nav-text">My Projects</span>
          </div>

          <div className="nav-item" onClick={() => navigate('/student/dashboard')}>
            <span className="nav-icon">📤</span>
            <span className="nav-text">Upload Project</span>
          </div>

          <div className="nav-item" onClick={() => navigate('/student/dashboard')}>
            <span className="nav-icon">👤</span>
            <span className="nav-text">Profile</span>
          </div>

          <div className="nav-item active">
            <span className="nav-icon">💬</span>
            <span className="nav-text">Error-Solving Community</span>
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
            <h1>My Community Posts</h1>
            <p>View and manage your questions and discussions</p>
          </div>
          <div className="header-right">
            <Link to="/student/community/new" className="create-post-link">
              <button className="create-post-btn">
                <span className="btn-icon">+</span>
                <span className="btn-text">Create New Post</span>
              </button>
            </Link>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Stats Overview - ONLY USER'S POSTS */}
          <div className="stats-overview" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '15px',
            marginBottom: '25px'
          }}>
            <div style={{
              backgroundColor: '#F5F5F5',
              padding: '15px',
              borderRadius: '8px',
              borderLeft: '4px solid #2196F3',
              position: 'relative'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                {stats.total}
              </div>
              <div style={{ color: '#666', fontSize: '0.85rem' }}>My Total Posts</div>
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                fontSize: '0.8rem',
                color: '#2196F3',
                fontWeight: '600'
              }}>
                📝
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#F5F5F5',
              padding: '15px',
              borderRadius: '8px',
              borderLeft: '4px solid #4CAF50',
              position: 'relative'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                {stats.approved}
              </div>
              <div style={{ color: '#666', fontSize: '0.85rem' }}>My Approved Posts</div>
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                fontSize: '0.8rem',
                color: '#4CAF50',
                fontWeight: '600'
              }}>
                ✓
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#F5F5F5',
              padding: '15px',
              borderRadius: '8px',
              borderLeft: '4px solid #FF9800',
              position: 'relative'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
                {stats.pending}
              </div>
              <div style={{ color: '#666', fontSize: '0.85rem' }}>My Pending Posts</div>
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                fontSize: '0.8rem',
                color: '#FF9800',
                fontWeight: '600'
              }}>
                ⏳
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#F5F5F5',
              padding: '15px',
              borderRadius: '8px',
              borderLeft: '4px solid #F44336',
              position: 'relative'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F44336' }}>
                {stats.rejected}
              </div>
              <div style={{ color: '#666', fontSize: '0.85rem' }}>My Rejected Posts</div>
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                fontSize: '0.8rem',
                color: '#F44336',
                fontWeight: '600'
              }}>
                ✗
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message" style={{
              backgroundColor: '#FFEBEE',
              color: '#C62828',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
              <button 
                onClick={fetchPosts}
                style={{
                  padding: '5px 15px',
                  backgroundColor: '#F44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              backgroundColor: '#f9f9f9',
              borderRadius: '10px'
            }}>
              <div style={{
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              <p style={{ color: '#666' }}>Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: '#f9f9f9',
              borderRadius: '10px',
              marginTop: '20px'
            }}>
              <div style={{ 
                fontSize: '60px', 
                marginBottom: '20px',
                opacity: 0.7 
              }}>💬</div>
              <h3 style={{ marginBottom: '15px' }}>No posts yet</h3>
              <p style={{ 
                marginBottom: '25px', 
                color: '#666', 
                maxWidth: '400px', 
                margin: '0 auto 25px',
                lineHeight: '1.6'
              }}>
                You haven't created any posts yet. Start by asking a question or sharing a solution with the community!
              </p>
              <Link to="/student/community/new">
                <button style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '12px 30px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}>
                  + Create Your First Post
                </button>
              </Link>
            </div>
          ) : (
            <div className="posts-grid">
              {posts.map((post) => (
                <div key={post.id} className="post-card" style={{
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  padding: '20px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                  marginBottom: '20px',
                  border: '1px solid #e0e0e0',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}>
                  <Link 
                    to={`/student/community/${post.id}`} 
                    className="post-link" 
                    style={{ 
                      textDecoration: 'none', 
                      color: 'inherit', 
                      display: 'block',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Status indicator - SIMPLIFIED */}
                    <div style={{
                      position: 'absolute',
                      top: '15px',
                      right: '15px',
                      zIndex: '1'
                    }}>
                      {getStatusBadge(post.status)}
                    </div>

                    <div className="post-header" style={{ 
                      marginBottom: '15px',
                      paddingRight: '50px'
                    }}>
                      <h3 className="post-title" style={{
                        margin: '0 0 10px 0',
                        fontSize: '1.2rem',
                        color: '#333',
                        lineHeight: '1.4',
                        fontWeight: '600'
                      }}>
                        {post.title}
                      </h3>
                      
                      <div style={{ 
                        display: 'flex', 
                        gap: '10px', 
                        alignItems: 'center',
                        flexWrap: 'wrap'
                      }}>
                        {getCategoryBadge(post.category)}
                        <span style={{
                          fontSize: '0.85rem',
                          color: '#666',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <span style={{ fontSize: '1rem' }}>💬</span>
                          <span>{post.comment_count || 0} comments</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="post-content" style={{
                      color: '#555',
                      lineHeight: '1.6',
                      marginBottom: '20px',
                      fontSize: '0.95rem'
                    }}>
                      {post.content && post.content.length > 150 
                        ? `${post.content.substring(0, 150)}...` 
                        : post.content || "No content"}
                    </div>
                    
                    <div className="post-footer" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid #eee',
                      paddingTop: '15px'
                    }}>
                      <div className="post-author" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <div className="author-avatar" style={{
                          width: '35px',
                          height: '35px',
                          borderRadius: '50%',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.9rem'
                        }}>
                          {post.user_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={{ 
                            fontWeight: '500', 
                            color: '#333',
                            fontSize: '0.95rem'
                          }}>
                            {post.user_name || 'You'}
                            {post.user_id === user.id && (
                              <span style={{
                                marginLeft: '8px',
                                fontSize: '0.75rem',
                                color: '#666',
                                backgroundColor: '#f0f0f0',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                (You)
                              </span>
                            )}
                          </div>
                          <div style={{ 
                            fontSize: '0.8rem', 
                            color: '#888' 
                          }}>
                            {post.created_at ? new Date(post.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Recently'}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#4CAF50',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        View Post →
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
          
          {/* Refresh Button */}
          {!loading && posts.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button 
                onClick={fetchPosts}
                style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>🔄</span>
                <span>Refresh Posts</span>
              </button>
            </div>
          )}
          
          {/* CSS Styles */}
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              
              .create-post-btn {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
                font-size: 1rem;
              }
              
              .create-post-btn:hover {
                background-color: #45a049;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
              }
              
              .logout-btn {
                background: none;
                border: 1px solid #ddd;
                padding: 10px 15px;
                border-radius: '8px';
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
                justify-content: center;
                transition: all 0.3s ease;
              }
              
              .logout-btn:hover {
                background-color: #f5f5f5;
                border-color: #ccc;
              }
              
              .nav-item {
                padding: 14px 20px;
                display: flex;
                align-items: center;
                gap: 14px;
                cursor: pointer;
                border-radius: 8px;
                transition: all 0.3s ease;
                margin-bottom: 5px;
              }
              
              .nav-item:hover {
                background-color: #f0f0f0;
              }
              
              .nav-item.active {
                background-color: #E3F2FD;
                color: #1976D2;
                font-weight: 500;
              }
              
              .post-card:hover {
                transform: translateY(-3px);
                box-shadow: 0 5px 20px rgba(0,0,0,0.12);
                border-color: #4CAF50;
              }
              
              .dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 1px solid #eee;
              }
              
              .dashboard-content {
                padding: 20px;
              }
              
              @media (max-width: 768px) {
                .stats-overview {
                  grid-template-columns: repeat(2, 1fr);
                }
                
                .dashboard-header {
                  flex-direction: column;
                  gap: 15px;
                  align-items: flex-start;
                }
                
                .header-right {
                  width: 100%;
                }
                
                .create-post-btn {
                  width: 100%;
                  justify-content: center;
                }
                
                .post-footer {
                  flex-direction: column;
                  gap: 15px;
                  align-items: flex-start;
                }
              }
            `}
          </style>
        </div>
      </div>
    </div>
  );
};

export default PostsPage;