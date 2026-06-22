import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage('❌ Please enter your email and password.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.token && data.role === 'admin') {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminRole', data.role);
        navigate('/dashboard');
      } else if (data.token && data.role === 'customer') {
        setMessage('⛔ Access denied! This portal is for administrators only.');
      } else if (data.token && data.role === 'courier_agent') {
        setMessage('⛔ Access denied! Agents should use the Courier Portal.');
      } else {
        setMessage('❌ ' + (data.error || 'Login failed. Please try again.'));
      }
    } catch (err) {
      setMessage('❌ Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      {/* LEFT PANEL — branding side */}
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(160deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px 50px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', margin: '0 auto 28px' }}>🛡️</div>
          
          <h1 style={{ color: 'white', fontSize: '2.2rem', fontWeight: '900', margin: '0 0 12px 0', lineHeight: 1.2 }}>
            Postal<span style={{ color: '#95d5b2' }}>Track</span>
          </h1>

          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '5px 16px', marginBottom: '28px' }}>
            <span style={{ color: '#d8f3dc', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1.5px' }}>ADMIN PORTAL</span>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '280px', margin: '0 auto 40px' }}>
            Secure management portal for administrators.
          </p>

          {[
            '📦 Manage all parcels 🔒',
            '👥 View all customers 🔒',
            '🔄 Update delivery status 🔒',
            '📊 System analytics 🔒',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', textAlign: 'left' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#95d5b2', flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL — form side */}
      <div style={{ flex: 1, background: '#f8fffe', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px 50px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '36px' }}>
            <h2 style={{ color: '#1b4332', fontSize: '1.8rem', fontWeight: '900', margin: '0 0 8px 0' }}>Welcome back</h2>
            <p style={{ color: '#6c757d', fontSize: '0.9rem', margin: 0 }}>Sign in to access the admin dashboard</p>
          </div>

          {/* EMAIL */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ color: '#2d6a4f', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>EMAIL ADDRESS</label>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="#52b788" strokeWidth="2" />
                <path d="M2 6L12 13L22 6" stroke="#52b788" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                placeholder="admin@postal.com"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ width: '100%', padding: '13px 14px 13px 42px', background: 'white', border: '2px solid #e8f5e9', borderRadius: '12px', color: '#1b4332', fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#52b788'}
                onBlur={e => e.target.style.borderColor = '#e8f5e9'}
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ color: '#2d6a4f', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} width="17" height="17" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#52b788" strokeWidth="2" />
                <path d="M7 11V7C7 4.24 9.24 2 12 2C14.76 2 17 4.24 17 7V11" stroke="#52b788" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                placeholder="admin123"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ width: '100%', padding: '13px 42px 13px 42px', background: 'white', border: '2px solid #e8f5e9', borderRadius: '12px', color: '#1b4332', fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#52b788'}
                onBlur={e => e.target.style.borderColor = '#e8f5e9'}
              />
              <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  {showPassword
                    ? <>
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="#52b788" strokeWidth="2" strokeLinecap="round" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="#52b788" strokeWidth="2" strokeLinecap="round" />
                        <line x1="1" y1="1" x2="23" y2="23" stroke="#52b788" strokeWidth="2" strokeLinecap="round" />
                      </>
                    : <>
                        <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="#52b788" strokeWidth="2" />
                        <circle cx="12" cy="12" r="3" stroke="#52b788" strokeWidth="2" />
                      </>
                  }
                </svg>
              </button>
            </div>
          </div>

          <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? 'rgba(27,67,50,0.5)' : 'linear-gradient(135deg, #1b4332, #2d6a4f)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 8px 25px rgba(27,67,50,0.3)', marginBottom: '20px', letterSpacing: '0.3px' }}>
            {loading ? '⏳ Signing in...' : '🔐 Sign In to Admin Panel'}
          </button>

          {message && (
            <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', background: message.includes('⛔') || message.includes('❌') ? 'rgba(193,18,31,0.08)' : 'rgba(82,183,136,0.1)', border: `1.5px solid ${message.includes('⛔') || message.includes('❌') ? 'rgba(193,18,31,0.3)' : 'rgba(82,183,136,0.4)'}`, color: message.includes('⛔') || message.includes('❌') ? '#c1121f' : '#2d6a4f', fontSize: '0.85rem', fontWeight: '600', textAlign: 'center' }}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;