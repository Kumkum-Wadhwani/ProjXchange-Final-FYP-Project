import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginChoice() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>ProjXchange</h1>
          <p style={styles.subtitle}>Choose your login option</p>
        </div>

        <div style={styles.buttons}>
          <button 
            style={styles.button}
            onClick={() => navigate('/login', { state: { role: 'student' } })}
          >
            <div style={styles.icon}>🎓</div>
            <div style={styles.text}>
              <h3>Student Login</h3>
              <p>Access your student dashboard</p>
            </div>
          </button>

          <button 
            style={styles.button}
            onClick={() => navigate('/login', { state: { role: 'investor' } })}
          >
            <div style={styles.icon}>💼</div>
            <div style={styles.text}>
              <h3>Investor Login</h3>
              <p>Access your investor dashboard</p>
            </div>
          </button>

          <button 
            style={styles.button}
            onClick={() => navigate('/login', { state: { role: 'admin' } })}
          >
            <div style={styles.icon}>⚙️</div>
            <div style={styles.text}>
              <h3>Admin Login</h3>
              <p>Platform administration</p>
            </div>
          </button>
        </div>

        <div style={styles.links}>
          <p>
            Don't have an account? <span onClick={() => navigate('/signup')} style={styles.link}>Sign up</span>
          </p>
          <p>
            <span onClick={() => navigate('/')} style={styles.link}>Back to home</span>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    color: '#333',
    margin: '0',
    fontSize: '28px',
  },
  subtitle: {
    color: '#666',
    margin: '5px 0 0 0',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '20px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    padding: '20px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    background: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'left',
    width: '100%',
  },
  icon: {
    fontSize: '2rem',
    marginRight: '15px',
  },
  text: {
    flex: '1',
  },
  links: {
    textAlign: 'center',
  },
  link: {
    color: '#667eea',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};