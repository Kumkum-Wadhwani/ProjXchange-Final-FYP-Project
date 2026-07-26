import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPost } from "../api/postsApi";
import "./CreatePost.css";

const CreatePost = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }

    if (title.trim().length < 5) {
      setError("Title should be at least 5 characters long");
      return;
    }

    if (content.trim().length < 10) {
      setError("Content should be at least 10 characters long");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await createPost({
        title: title.trim(),
        content: content.trim()
      });

      console.log("Post created successfully:", response);
      
      // Redirect to community page
      navigate("/student/community");
      
    } catch (error) {
      console.error("Create post error:", error);
      setError(error.response?.data?.message || "Failed to create post. Please try again.");
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
            <h1>Create New Post</h1>
            <p>Ask a question or share a problem you're facing</p>
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
          <div className="create-post-container">
            <div className="create-post-form-container">
              <form onSubmit={handleSubmit} className="create-post-form">
                {error && (
                  <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="title" className="form-label">
                    Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    className="form-input"
                    placeholder="What's your question or issue?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength="200"
                    disabled={loading}
                  />
                  <div className="form-hint">
                    Be specific about your issue (max 200 characters)
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="content" className="form-label">
                    Details *
                  </label>
                  <textarea
                    id="content"
                    className="form-textarea"
                    rows="8"
                    placeholder="Describe your issue in detail. Include error messages, code snippets, and what you've tried so far."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    maxLength="5000"
                    disabled={loading}
                  />
                  <div className="form-hint">
                    Include relevant details like error messages, code snippets, steps to reproduce
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading || !title.trim() || !content.trim()}
                  >
                    {loading ? (
                      <>
                        <span className="loading-spinner-small"></span>
                        Posting...
                      </>
                    ) : (
                      "Create Post"
                    )}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => navigate("/student/community")}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>

              <div className="form-sidebar">
                <div className="sidebar-card">
                  <h3>💡 Posting Guidelines</h3>
                  <ul>
                    <li>Be specific about your problem</li>
                    <li>Include relevant error messages</li>
                    <li>Share code snippets when possible</li>
                    <li>Explain what you've already tried</li>
                    <li>Be respectful to other members</li>
                  </ul>
                </div>

                <div className="sidebar-card">
                  <h3>📋 Before You Post</h3>
                  <ul>
                    <li>Check if your question has been asked before</li>
                    <li>Use descriptive titles</li>
                    <li>Format your code properly</li>
                    <li>Add relevant tags</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;