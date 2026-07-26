import React from "react";

export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="page-center">
      <div className="auth-card">
        <div className="brand">
          <div className="logo">PX</div>
          <div className="brand-text">
            <h1>ProjXchange</h1>
          </div>
        </div>
        <h2 style={{textAlign: 'center', marginBottom: '20px', color: '#52667a'}}>{title}</h2>
        {subtitle && <p style={{textAlign: 'center', color: '#9cb1bb', marginBottom: '30px'}}>{subtitle}</p>}
        <div>{children}</div>
        <div className="card-footer">© {new Date().getFullYear()} ProjXchange</div>
      </div>
    </div>
  );
}