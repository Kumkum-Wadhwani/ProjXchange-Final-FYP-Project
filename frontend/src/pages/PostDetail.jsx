import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPost, addComment, getComments  } from "../api/postsApi";
import "./PostDetail.css"; 

const PostDetail = ({ user, onLogout }) => {
  const { postId } = useParams();
  const navigate = useNavigate();
  
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchPost();
  }, [postId, token, navigate]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getPost(postId);
      console.log("Fetched post data:", data);
      setPost(data);
    } catch (err) {
      console.error("Error loading post:", err);
      setError("Failed to load post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      
      await addComment(postId, { content: comment });
      setComment("");
      
      // Refresh the post to get updated comments
      await fetchPost();
    } catch (err) {
      console.error("Error adding comment:", err);
      setError("Failed to add comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    if (onLogout) onLogout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-sidebar">
          {/* Same sidebar structure */}
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
            <div className="nav-item" onClick={() => navigate('/student/community')}>
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
        <div className="dashboard-main">
          <div className="post-detail-loading">
            <div className="loading-spinner"></div>
            <p>Loading post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="dashboard">
        <div className="dashboard-sidebar">
          {/* Same sidebar structure */}
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
            <div className="nav-item" onClick={() => navigate('/student/community')}>
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
        <div className="dashboard-main">
          <div className="post-detail-error">
            <div className="error-icon">⚠️</div>
            <h3>Error loading post</h3>
            <p>{error}</p>
            <div className="button-group">
              <button onClick={() => navigate("/student/community")} className="back-btn">
                ← Back to Community
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="dashboard">
        <div className="dashboard-sidebar">
          {/* Same sidebar structure */}
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
            <div className="nav-item" onClick={() => navigate('/student/community')}>
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
        <div className="dashboard-main">
          <div className="post-not-found">
            <div className="not-found-icon">📄</div>
            <h3>Post not found</h3>
            <p>The post you're looking for doesn't exist or has been removed.</p>
            <div className="button-group">
              <button onClick={() => navigate("/student/community")} className="back-btn">
                ← Back to Community
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Sidebar Navigation - SAME AS STUDENT DASHBOARD */}
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
          {/* Dashboard Tab */}
          <div
            className="nav-item"
            onClick={() => navigate('/student/dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </div>

          {/* Projects Tab */}
          <div
            className="nav-item"
            onClick={() => navigate('/student/dashboard')}
          >
            <span className="nav-icon">📁</span>
            <span className="nav-text">My Projects</span>
          </div>

          {/* Upload Tab */}
          <div
            className="nav-item"
            onClick={() => navigate('/student/dashboard')}
          >
            <span className="nav-icon">📤</span>
            <span className="nav-text">Upload Project</span>
          </div>

          {/* Profile Tab */}
          <div
            className="nav-item"
            onClick={() => navigate('/student/dashboard')}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-text">Profile</span>
          </div>

          {/* Community Tab */}
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
            <h1>Post Details</h1>
            <p>View and discuss the post</p>
          </div>
          <div className="header-right">
            <button 
              onClick={() => navigate("/student/community")} 
              className="back-btn"
              style={{
                padding: '8px 16px',
                background: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ← Back to Community
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="post-detail-container">
            <div className="post-detail-header">
              <h1>{post.post?.title || post.title}</h1>
              <div className="post-meta">
                <div className="post-author">
                  <span className="author-avatar">
                    {post.post?.user_name?.charAt(0).toUpperCase() || 
                     post.user_name?.charAt(0).toUpperCase() || 
                     'U'}
                  </span>
                  <span className="author-name">
                    {post.post?.user_name || post.user_name || 'Unknown User'}
                  </span>
                  <span className="post-date">
                    {formatDate(post.post?.created_at || post.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="post-content-container">
              <div className="post-content">
                {post.post?.content || post.content}
              </div>
            </div>

            {/* Comments Section */}
            <div className="comments-section">
              <div className="comments-header">
                <h2>
                  💬 Comments 
                  <span className="comment-count">
                    ({post.comments?.length || 0})
                  </span>
                </h2>
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="add-comment-form">
                <div className="form-group">
                  <label htmlFor="comment">Add your comment</label>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write your helpful comment here..."
                    rows="4"
                    disabled={submitting}
                    className="comment-textarea"
                  />
                </div>
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="submit-comment-btn"
                    disabled={submitting || !comment.trim()}
                  >
                    {submitting ? (
                      <>
                        <span className="loading-spinner-small"></span>
                        Posting...
                      </>
                    ) : (
                      "Post Comment"
                    )}
                  </button>
                </div>
              </form>

              {/* Comments List */}
              <div className="comments-list">
                {post.comments && post.comments.length > 0 ? (
                  post.comments.map((comment) => (
                    <div key={comment.id} className="comment-card">
                      <div className="comment-header">
                        <div className="comment-author">
                          <span className="comment-avatar">
                            {comment.user_name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                          <div className="comment-author-info">
                            <span className="comment-author-name">
                              {comment.user_name || 'Unknown User'}
                            </span>
                            <span className="comment-date">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="comment-content">
                        {comment.content}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-comments">
                    <div className="no-comments-icon">💬</div>
                    <h3>No comments yet</h3>
                    <p>Be the first to share your thoughts or solution!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;