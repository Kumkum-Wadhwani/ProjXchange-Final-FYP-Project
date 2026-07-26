import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

/* Public Pages */
import Welcome from "./pages/Welcome";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Contact from "./pages/Contact";

/* Auth Pages */
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPassword from "./pages/ForgotPassword";

/* Dashboards */
import StudentDashboard from "./pages/StudentDashboard";
import InvestorDashboard from "./pages/InvestorDashboard";
import AdminDashboard from "./pages/AdminDashboard";

/* Community */
import PostsPage from "./pages/PostsPage";
import PostDetail from "./pages/PostDetail";
import CreatePost from "./pages/CreatePost";

/* Stripe */
import StripeProvider from "./components/StripeProvider";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (userData && token) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (loading) {
    return <div className="page-center">Loading...</div>;
  }

  return (
    <StripeProvider>
      <Router>
        <Routes>

          {/* ================= PUBLIC WEBSITE ================= */}
          <Route path="/" element={<Welcome />} />
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />

          {/* ================= AUTH ================= */}
          <Route
            path="/login"
            element={!user ? <LoginPage onLogin={handleLogin} /> : <Navigate to={`/${user.role}/dashboard`} />}
          />
          <Route
            path="/signup"
            element={!user ? <SignupPage onLogin={handleLogin} /> : <Navigate to={`/${user.role}/dashboard`} />}
          />
          <Route
            path="/forgot-password"
            element={!user ? <ForgotPassword /> : <Navigate to={`/${user.role}/dashboard`} />}
          />

          {/* ================= DASHBOARDS ================= */}
          <Route
            path="/student/dashboard"
            element={user?.role === "student" ? <StudentDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />

          <Route
            path="/investor/dashboard"
            element={user?.role === "investor" ? <InvestorDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />

          <Route
            path="/admin/dashboard"
            element={user?.role === "admin" ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />

          {/* ================= STUDENT COMMUNITY ================= */}
          <Route
            path="/student/community"
            element={user?.role === "student" ? <PostsPage user={user} /> : <Navigate to="/login" />}
          />

          <Route
            path="/student/community/new"
            element={user?.role === "student" ? <CreatePost user={user} /> : <Navigate to="/login" />}
          />

          <Route
            path="/student/community/:postId"
            element={user?.role === "student" ? <PostDetail user={user} /> : <Navigate to="/login" />}
          />

          {/* ================= FALLBACK ================= */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Router>
    </StripeProvider>
  );
}

export default App;
