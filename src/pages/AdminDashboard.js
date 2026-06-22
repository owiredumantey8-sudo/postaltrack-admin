import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [parcels, setParcels] = useState([]);
  const [users, setUsers] = useState([]);
  const [agents, setAgents] = useState([]);
 
  const [activeTab, setActiveTab] = useState('parcels');

  const [supportTickets, setSupportTickets] = useState([]);

  const [modalParcel, setModalParcel] = useState(null);
  const [modalStatus, setModalStatus] = useState('');
  const [modalLocation, setModalLocation] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [updateMsg, setUpdateMsg] = useState('');
  const [updating, setUpdating] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [selectedParcels, setSelectedParcels] = useState([]);
  const [deletingMultiple, setDeletingMultiple] = useState(false);

  const [assigningId, setAssigningId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [emailForm, setEmailForm] = useState({ email: '', subject: '', message: '' });
  const [emailMsg, setEmailMsg] = useState('');
  const [sending, setSending] = useState(false);

  const [copiedId, setCopiedId] = useState(null);
  const [notification, setNotification] = useState(null);

  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [addAgentForm, setAddAgentForm] = useState({ full_name: '', email: '', phone: '', password: '', assigned_region: '' });
  const [addAgentMsg, setAddAgentMsg] = useState('');
  const [addingAgent, setAddingAgent] = useState(false);
  const [deletingAgentId, setDeletingAgentId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const role = localStorage.getItem('adminRole');
    if (!token) { navigate('/'); return; }
    
    
    fetchParcels();
    fetchUsers();
    fetchAgents();
    fetchSupportTickets(); 

    const interval = setInterval(() => {
      fetchSupportTickets();
    }, 15000);

    return () => clearInterval(interval);
  }, [navigate]);

  const fetchParcels = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:5000/api/parcels/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setParcels(Array.isArray(data) ? data : []);
    } catch (error) { console.log(error); }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:5000/api/auth/users/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) { console.log(error); }
  };

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:5000/api/agents/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAgents(Array.isArray(data) ? data : []);
    } catch (error) { console.log(error); }
  };

  const fetchSupportTickets = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:5000/api/profile/support-tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSupportTickets(Array.isArray(data) ? data : []);
    } catch (error) { console.log("Support tickets error:", error); }
  };

  const resolveTicket = async (ticketId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`http://localhost:5000/api/profile/support-tickets/${ticketId}/resolve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Ticket marked as resolved!');
      fetchSupportTickets();
    } catch { showNotification('Failed to resolve ticket.', 'error'); }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredParcels = useMemo(() => {
    return parcels.filter(p => {
      const matchesSearch =
        !searchQuery ||
        p.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.recipient_address?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        p.current_status?.toLowerCase().includes(statusFilter.toLowerCase());
      return matchesSearch && matchesStatus;
    });
  }, [parcels, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const delivered = parcels.filter(p => p.current_status?.toLowerCase().includes('delivered')).length;
    const inTransit = parcels.filter(p => p.current_status?.toLowerCase().includes('transit')).length;
    const outForDelivery = parcels.filter(p => p.current_status?.toLowerCase().includes('out')).length;
    const booked = parcels.filter(p => p.current_status?.toLowerCase().includes('booked')).length;
    return { total: parcels.length, delivered, inTransit, outForDelivery, booked };
  }, [parcels]);

  const toggleSelectParcel = (id) => {
    setSelectedParcels(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    setSelectedParcels(selectedParcels.length === filteredParcels.length ? [] : filteredParcels.map(p => p.parcel_id));
  };

  const deleteSelectedParcels = async () => {
    if (selectedParcels.length === 0) return;
    if (!window.confirm(`Delete ${selectedParcels.length} parcel(s)? This cannot be undone.`)) return;
    setDeletingMultiple(true);
    try {
      const token = localStorage.getItem('adminToken');
      await Promise.all(selectedParcels.map(id =>
        fetch(`http://localhost:5000/api/parcels/delete/${id}`, {
          method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
        })
      ));
      showNotification(`${selectedParcels.length} parcel(s) deleted successfully!`);
      setSelectedParcels([]);
      fetchParcels();
    } catch {
      showNotification('Some deletions failed. Please try again.', 'error');
    }
    setDeletingMultiple(false);
  };

  const deleteParcel = async (parcelId, trackingNumber) => {
    if (!window.confirm(`Delete parcel ${trackingNumber}? This cannot be undone.`)) return;
    setDeletingId(parcelId);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`http://localhost:5000/api/parcels/delete/${parcelId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) { showNotification('Parcel deleted successfully!'); fetchParcels(); }
      else showNotification('Delete failed.', 'error');
    } catch { showNotification('Something went wrong.', 'error'); }
    setDeletingId(null);
  };

  const deleteUser = async (userId, fullName) => {
    if (!window.confirm(`Delete user "${fullName}"? This cannot be undone.`)) return;
    setDeletingId(userId);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`http://localhost:5000/api/auth/users/delete/${userId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) { showNotification('User deleted successfully!'); fetchUsers(); }
      else showNotification('Delete failed.', 'error');
    } catch { showNotification('Something went wrong.', 'error'); }
    setDeletingId(null);
  };

  const assignAgent = async (parcelId, agentId) => {
    setAssigningId(parcelId);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`http://localhost:5000/api/parcels/assign/${parcelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ agent_id: agentId || null })
      });
      if (res.ok) {
        showNotification(agentId ? 'Agent assigned successfully!' : 'Agent unassigned.');
        fetchParcels();
      } else {
        showNotification('Assignment failed. Please try again.', 'error');
      }
    } catch { showNotification('Something went wrong.', 'error'); }
    setAssigningId(null);
  };

  const addAgent = async () => {
    const { full_name, email, phone, password, assigned_region } = addAgentForm;
    if (!full_name || !email || !password || !assigned_region) {
      setAddAgentMsg('Please fill in all required fields.');
      return;
    }
    setAddingAgent(true);
    setAddAgentMsg('');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:5000/api/agents/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name, email, phone, password, assigned_region })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('Agent added successfully!');
        setShowAddAgentModal(false);
        setAddAgentForm({ full_name: '', email: '', phone: '', password: '', assigned_region: '' });
        fetchAgents();
      } else {
        setAddAgentMsg(data.message || 'Failed to add agent.');
      }
    } catch { setAddAgentMsg('Server error. Please try again.'); }
    setAddingAgent(false);
  };

  const deleteAgent = async (agentId, agentName) => {
    if (!window.confirm(`Delete agent "${agentName}"? Their parcels will be unassigned.`)) return;
    setDeletingAgentId(agentId);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`http://localhost:5000/api/agents/delete/${agentId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) { showNotification('Agent deleted successfully!'); fetchAgents(); }
      else showNotification('Delete failed.', 'error');
    } catch { showNotification('Something went wrong.', 'error'); }
    setDeletingAgentId(null);
  };

  const openUpdateModal = (parcel) => {
    setModalParcel(parcel);
    // Safety fallback: Force Admin status to 'booked' or 'dispatched' if they open an agent's parcel
    const allowedStatuses = ['booked', 'dispatched'];
    setModalStatus(allowedStatuses.includes(parcel.current_status) ? parcel.current_status : 'booked');
    setModalLocation(parcel.current_location || '');
    setModalDescription('');
    setUpdateMsg('');
  };

  const closeModal = () => { setModalParcel(null); setUpdateMsg(''); };

  const updateStatus = async () => {
    if (!modalStatus) { setUpdateMsg('Please select a status.'); return; }
    setUpdating(true);
    setUpdateMsg('');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`http://localhost:5000/api/parcels/update/${modalParcel.parcel_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_status: modalStatus, current_location: modalLocation, description: modalDescription })
      });
      if (res.ok) { showNotification('Parcel status updated successfully!'); closeModal(); fetchParcels(); }
      else setUpdateMsg('Update failed. Please try again.');
    } catch { setUpdateMsg('Update failed. Please try again.'); }
    setUpdating(false);
  };

  const sendEmail = async () => {
    if (!emailForm.email || !emailForm.subject || !emailForm.message) {
      setEmailMsg('Please fill in all fields.'); return;
    }
    setSending(true); setEmailMsg('');
    try {
      await fetch('http://localhost:5000/api/notifications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: emailForm.email, subject: emailForm.subject, text: emailForm.message })
      });
      showNotification('Email sent successfully!');
      setEmailForm({ email: '', subject: '', message: '' });
    } catch { setEmailMsg('Failed to send email. Please try again.'); }
    setSending(false);
  };

  const logout = () => { localStorage.removeItem('adminToken'); localStorage.removeItem('adminRole'); navigate('/'); };

  const copyEmail = (emailText, parcelId) => {
    navigator.clipboard.writeText(emailText);
    setCopiedId(parcelId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusStyle = (s) => {
    if (!s) return { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8' };
    const sl = s.toLowerCase();
    if (sl.includes('delivered')) return { bg: '#dcfce7', color: '#15803d', dot: '#22c55e' };
    if (sl.includes('out')) return { bg: '#fff7ed', color: '#c2410c', dot: '#f97316' };
    if (sl.includes('transit')) return { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' };
    if (sl.includes('dispatch')) return { bg: '#fefce8', color: '#a16207', dot: '#eab308' };
    if (sl.includes('booked')) return { bg: '#f5f3ff', color: '#7c3aed', dot: '#a855f7' };
    if (sl.includes('assigned')) return { bg: '#ecfeff', color: '#0e7490', dot: '#06b6d4' };
    return { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const ghRegions = ['Greater Accra','Ashanti','Western','Eastern','Central','Northern','Upper East','Upper West','Volta','Brong-Ahafo','Oti','Ahafo','Bono East','North East','Savannah','Western North'];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1.5px solid ${notification.type === 'error' ? '#fca5a5' : '#86efac'}`,
          color: notification.type === 'error' ? '#dc2626' : '#15803d',
          padding: '14px 20px', borderRadius: '12px', fontWeight: '600', fontSize: '0.88rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: '8px',
          animation: 'slideIn 0.3s ease', maxWidth: '340px',
        }}>
          {notification.type === 'error' ? '❌' : '✅'} {notification.msg}
        </div>
      )}

      {/* --- UPDATED ADMIN UPDATE MODAL (STRICT HANDOVER + OFFICE LOCATION) --- */}
      {modalParcel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '520px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ color: '#0f172a', fontSize: '1.2rem', fontWeight: '800', margin: '0 0 4px' }}>Update Parcel Status</h2>
                <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: '700' }}>{modalParcel.tracking_number}</p>
              </div>
              <button onClick={closeModal} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.1rem', color: '#64748b', fontWeight: '700' }}>✕</button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>RECIPIENT</label>
              <p style={{ margin: 0, color: '#334155', fontWeight: '600', fontSize: '0.9rem' }}>{modalParcel.recipient_name}</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>NEW STATUS</label>
              <select value={modalStatus} onChange={e => setModalStatus(e.target.value)} style={inputStyle}>
                <option value="">Choose status...</option>
                <option value="booked">📌 Booked</option>
                <option value="dispatched">🚀 Dispatched</option>
                {/* Strict Handover: Removed In Transit, Out for Delivery, and Delivered */}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>CURRENT LOCATION <span style={{color: '#94a3b8', fontWeight: '500', textTransform: 'none', letterSpacing: '0'}}>(Optional)</span></label>
              <input type="text" placeholder="e.g. Main Office, Accra Hub, Tema Branch" value={modalLocation} onChange={e => setModalLocation(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>NOTES (OPTIONAL)</label>
              <textarea placeholder="Any notes about this update..." value={modalDescription} onChange={e => setModalDescription(e.target.value)} style={{ ...inputStyle, height: '90px', resize: 'none' }} />
            </div>
            {updateMsg && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '16px', fontWeight: '600' }}>{updateMsg}</p>}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={closeModal} style={{ flex: 1, padding: '13px', border: '2px solid #e2e8f0', background: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', color: '#64748b', fontSize: '0.9rem' }}>Cancel</button>
              <button onClick={updateStatus} disabled={updating} style={{ flex: 2, padding: '13px', background: updating ? '#95d5b2' : 'linear-gradient(135deg, #1b4332, #2d6a4f)', color: 'white', border: 'none', borderRadius: '10px', cursor: updating ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(27,67,50,0.3)' }}>
                {updating ? '⏳ Updating...' : '✅ Save Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddAgentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddAgentModal(false); }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>Add New Agent</h2>
              <button onClick={() => setShowAddAgentModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.1rem', color: '#64748b', fontWeight: '700' }}>✕</button>
            </div>
            {[
              { label: 'FULL NAME *', key: 'full_name', type: 'text', placeholder: 'e.g. Kofi Mensah' },
              { label: 'EMAIL *', key: 'email', type: 'email', placeholder: 'e.g. kofi@postal.com' },
              { label: 'PHONE', key: 'phone', type: 'text', placeholder: 'e.g. 0244123456' },
              { label: 'PASSWORD *', key: 'password', type: 'password', placeholder: 'Set login password' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>{field.label}</label>
                <input type={field.type} placeholder={field.placeholder}
                  value={addAgentForm[field.key]}
                  onChange={e => setAddAgentForm(f => ({ ...f, [field.key]: e.target.value }))}
                  style={inputStyle} />
              </div>
            ))}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>ASSIGNED REGION *</label>
              <select value={addAgentForm.assigned_region}
                onChange={e => setAddAgentForm(f => ({ ...f, assigned_region: e.target.value }))}
                style={inputStyle}>
                <option value="">Select region...</option>
                {ghRegions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {addAgentMsg && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '14px', fontWeight: '600' }}>{addAgentMsg}</p>}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowAddAgentModal(false)} style={{ flex: 1, padding: '13px', border: '2px solid #e2e8f0', background: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', color: '#64748b' }}>Cancel</button>
              <button onClick={addAgent} disabled={addingAgent} style={{ flex: 2, padding: '13px', background: addingAgent ? '#95d5b2' : 'linear-gradient(135deg, #1b4332, #2d6a4f)', color: 'white', border: 'none', borderRadius: '10px', cursor: addingAgent ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(27,67,50,0.3)' }}>
                {addingAgent ? '⏳ Adding...' : '➕ Add Agent'}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav style={{ background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)', padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px', boxShadow: '0 4px 20px rgba(27,67,50,0.25)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>
            Postal<span style={{ color: '#95d5b2' }}>Track</span>
          </span>
          <span style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '3px 12px', color: '#d8f3dc', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '1px' }}>
            ADMIN PANEL
          </span>
        </div>
        <button onClick={logout} style={{ background: '#c1121f', border: 'none', color: 'white', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.82rem', boxShadow: '0 4px 12px rgba(193,18,31,0.3)' }}>Logout</button>
      </nav>

      <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ color: '#0f172a', fontSize: '1.75rem', fontWeight: '900', margin: '0 0 4px', letterSpacing: '-0.5px' }}>Admin Dashboard</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>Manage parcels, assign courier agents and send notifications</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[
            { value: stats.total, label: 'Total Parcels', icon: '📦', color: '#1b4332', bg: '#d8f3dc', border: '#52b788' },
            { value: stats.booked, label: 'Booked', icon: '📌', color: '#7c3aed', bg: '#f5f3ff', border: '#a855f7' },
            { value: stats.inTransit, label: 'In Transit', icon: '🚚', color: '#1d4ed8', bg: '#eff6ff', border: '#3b82f6' },
            { value: stats.outForDelivery, label: 'Out for Delivery', icon: '📍', color: '#c2410c', bg: '#fff7ed', border: '#f97316' },
            { value: stats.delivered, label: 'Delivered', icon: '✅', color: '#15803d', bg: '#dcfce7', border: '#22c55e' },
            { value: agents.length, label: 'Active Agents', icon: '🚴', color: '#0e7490', bg: '#ecfeff', border: '#06b6d4' },
            { value: users.filter(u => u.role === 'customer').length, label: 'Customers', icon: '👥', color: '#0369a1', bg: '#e0f2fe', border: '#38bdf8' },
            { value: supportTickets.filter(t => t.status === 'pending').length, label: 'Pending Tickets', icon: '🎧', color: '#b45309', bg: '#fffbeb', border: '#fbbf24' },
          ].map((stat, i) => (
            <div key={i} style={{ background: 'white', padding: '20px 22px', borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: `4px solid ${stat.border}`, transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)'; }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: stat.color, lineHeight: 1, marginBottom: '5px' }}>{stat.value}</div>
              <div style={{ fontSize: '0.78rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: '4px solid #22c55e' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>📈 Delivery Success Rate</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: '900', color: stats.total > 0 ? (stats.delivered / stats.total * 100 >= 50 ? '#15803d' : '#dc2626') : '#94a3b8' }}>
                {stats.total > 0 ? Math.round(stats.delivered / stats.total * 100) : 0}%
              </span>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>of parcels delivered</span>
            </div>
            <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${stats.total > 0 ? (stats.delivered / stats.total * 100) : 0}%`, height: '100%', background: 'linear-gradient(90deg, #22c55e, #4ade80)', borderRadius: '10px', transition: 'width 0.5s ease' }}></div>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>{stats.delivered} delivered out of {stats.total} total</p>
          </div>

          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>📊 Current Parcel Distribution</div>
            <div style={{ width: '100%', height: '14px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', display: 'flex', marginBottom: '16px' }}>
              {stats.total > 0 ? (
                <>
                  <div style={{ width: `${(stats.booked / stats.total) * 100}%`, background: '#7c3aed' }} title="Booked"></div>
                  <div style={{ width: `${(stats.inTransit / stats.total) * 100}%`, background: '#3b82f6' }} title="In Transit"></div>
                  <div style={{ width: `${(stats.outForDelivery / stats.total) * 100}%`, background: '#f97316' }} title="Out for Delivery"></div>
                  <div style={{ width: `${(stats.delivered / stats.total) * 100}%`, background: '#22c55e' }} title="Delivered"></div>
                </>
              ) : <div style={{ width: '100%', background: '#e2e8f0' }}></div>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Booked', val: stats.booked, color: '#7c3aed' },
                { label: 'In Transit', val: stats.inTransit, color: '#3b82f6' },
                { label: 'Out for Delivery', val: stats.outForDelivery, color: '#f97316' },
                { label: 'Delivered', val: stats.delivered, color: '#22c55e' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, flexShrink: 0 }}></span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.label}:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginLeft: 'auto' }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: '4px solid #06b6d4' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>🏆 Top Performing Agents</div>
            {agents.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>No agents added yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[...agents].sort((a, b) => (b.parcel_count || 0) - (a.parcel_count || 0)).slice(0, 3).map((agent, idx) => (
                  <div key={agent.agent_id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: idx === 0 ? '#fefce8' : '#f1f5f9', color: idx === 0 ? '#a16207' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800', flexShrink: 0 }}>
                      #{idx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: '700', color: '#0f172a', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.agent_name}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>{agent.assigned_region}</p>
                    </div>
                    <span style={{ background: '#ecfeff', color: '#0e7490', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                      {agent.parcel_count || 0} parcels
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#e2e8f0', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
          {[
            { id: 'parcels', label: '📦 Parcels' },
            { id: 'agents', label: '🚴 Agents' },
            { id: 'email', label: '📧 Email' },
            { id: 'users', label: '👥 Users' },
            { id: 'support', label: '🆘 Support' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '9px 22px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', background: activeTab === tab.id ? 'white' : 'transparent', color: activeTab === tab.id ? '#1b4332' : '#64748b', boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'parcels' && (
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={titleStyle}>All Parcels ({filteredParcels.length})</h2>
              {agents.length === 0 && (
                <span style={{ background: '#fef9c3', color: '#a16207', border: '1px solid #fde047', borderRadius: '8px', padding: '6px 14px', fontSize: '0.78rem', fontWeight: '700' }}>
                  ⚠️ No active agents yet — add agents to enable assignment
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem' }}>🔍</span>
                <input type="text" placeholder="Search by tracking number, name or address..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...inputStyle, paddingLeft: '36px' }} />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, maxWidth: '200px' }}>
                <option value="all">All Statuses</option>
                <option value="booked">📌 Booked</option>
                <option value="dispatched">🚀 Dispatched</option>
                <option value="transit">🚚 In Transit</option>
                <option value="out">📍 Out for Delivery</option>
                <option value="delivered">✅ Delivered</option>
              </select>
            </div>
            {filteredParcels.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#1b4332', fontWeight: '700', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={selectedParcels.length === filteredParcels.length && filteredParcels.length > 0} onChange={toggleSelectAll} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#52b788' }} />
                  {selectedParcels.length === filteredParcels.length ? 'Deselect All' : 'Select All'}
                </label>
                {selectedParcels.length > 0 && (
                  <>
                    <span style={{ color: '#64748b', fontSize: '0.83rem', fontWeight: '600' }}>{selectedParcels.length} selected</span>
                    <button onClick={deleteSelectedParcels} disabled={deletingMultiple} style={{ background: deletingMultiple ? '#fca5a5' : '#fef2f2', color: '#dc2626', border: '1.5px solid #fca5a5', padding: '7px 16px', borderRadius: '8px', cursor: deletingMultiple ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '0.82rem' }}>
                      {deletingMultiple ? '⏳ Deleting...' : `🗑️ Delete Selected (${selectedParcels.length})`}
                    </button>
                  </>
                )}
              </div>
            )}
            {filteredParcels.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
                <p style={{ fontWeight: '600', margin: 0 }}>{searchQuery || statusFilter !== 'all' ? 'No parcels match your search.' : 'No parcels found.'}</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={thStyle}><span style={{ opacity: 0 }}>_</span></th>
                      <th style={thStyle}>Tracking No.</th>
                      <th style={thStyle}>Recipient</th>
                      <th style={thStyle}>Address</th>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Date Booked</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Assigned Agent</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParcels.map((parcel, idx) => {
                      const sc = getStatusStyle(parcel.current_status);
                      const isSelected = selectedParcels.includes(parcel.parcel_id);
                      const isAssigning = assigningId === parcel.parcel_id;
                      return (
                        <tr key={parcel.parcel_id} style={{ background: isSelected ? '#f0fdf4' : idx % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fafafa'; }}>
                          <td style={{ ...tdStyle, paddingLeft: '16px' }}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelectParcel(parcel.parcel_id)} style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#52b788' }} />
                          </td>
                          <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#1b4332', fontSize: '0.82rem' }}>{parcel.tracking_number}</span></td>
                          <td style={{ ...tdStyle, fontWeight: '600', color: '#0f172a' }}>{parcel.recipient_name}</td>
                          <td style={{ ...tdStyle, color: '#64748b', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{parcel.recipient_address}</td>
                          <td style={tdStyle}>
                            {(parcel.email || parcel.recipient_email) ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: '#64748b', fontSize: '0.8rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{parcel.email || parcel.recipient_email}</span>
                                <button onClick={() => copyEmail(parcel.email || parcel.recipient_email, parcel.parcel_id)} style={{ background: copiedId === parcel.parcel_id ? '#d8f3dc' : '#f1f5f9', border: 'none', padding: '3px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700', color: copiedId === parcel.parcel_id ? '#1b4332' : '#475569', whiteSpace: 'nowrap' }}>
                                  {copiedId === parcel.parcel_id ? 'Copied!' : 'Copy'}
                                </button>
                              </div>
                            ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                          </td>
                          <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(parcel.created_at || parcel.booked_at)}</td>
                          <td style={tdStyle}>
                            <span style={{ background: sc.bg, color: sc.color, padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                              {parcel.current_status || 'Unknown'}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            {agents.length === 0 ? (
                              <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>No agents</span>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <select disabled={isAssigning} value={parcel.agent_id || ''} onChange={e => assignAgent(parcel.parcel_id, e.target.value)}
                                  style={{ padding: '5px 8px', borderRadius: '7px', border: parcel.agent_id ? '1.5px solid #06b6d4' : '1.5px solid #e2e8f0', background: parcel.agent_id ? '#ecfeff' : '#f8fafc', color: parcel.agent_id ? '#0e7490' : '#94a3b8', fontSize: '0.78rem', fontWeight: '700', cursor: isAssigning ? 'not-allowed' : 'pointer', minWidth: '130px', outline: 'none' }}>
                                  <option value="">Unassigned</option>
                                  {agents.map(agent => (
                                    <option key={agent.agent_id} value={agent.agent_id}>{agent.agent_name} ({agent.assigned_region})</option>
                                  ))}
                                </select>
                                {isAssigning && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>⏳</span>}
                              </div>
                            )}
                          </td>
                          <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => openUpdateModal(parcel)} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '0.75rem' }}>✏️ Update</button>
                              <button onClick={() => deleteParcel(parcel.parcel_id, parcel.tracking_number)} disabled={deletingId === parcel.parcel_id} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '0.75rem' }}>
                                {deletingId === parcel.parcel_id ? '...' : '🗑️'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'agents' && (
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ ...titleStyle, margin: '0 0 4px' }}>Courier Agents ({agents.length})</h2>
                <p style={{ color: '#64748b', margin: 0, fontSize: '0.83rem' }}>Manage agents who deliver parcels across regions</p>
              </div>
              <button onClick={() => { setShowAddAgentModal(true); setAddAgentMsg(''); }} style={{ background: 'linear-gradient(135deg, #1b4332, #2d6a4f)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', boxShadow: '0 4px 15px rgba(27,67,50,0.3)' }}>
                ➕ Add New Agent
              </button>
            </div>
            {agents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🚴</div>
                <p style={{ fontWeight: '700', margin: '0 0 8px', fontSize: '1rem', color: '#64748b' }}>No agents yet</p>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Click "Add New Agent" to get started</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      {['Agent Name', 'Email', 'Phone', 'Region', 'Parcels Assigned', 'Joined', 'Actions'].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((agent, idx) => (
                      <tr key={agent.agent_id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ ...tdStyle, fontWeight: '700', color: '#0f172a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#d8f3dc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '800', color: '#1b4332', flexShrink: 0 }}>
                              {agent.agent_name?.charAt(0).toUpperCase()}
                            </div>
                            {agent.agent_name}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, color: '#475569' }}>{agent.email || '—'}</td>
                        <td style={{ ...tdStyle, color: '#64748b' }}>{agent.phone_number || '—'}</td>
                        <td style={tdStyle}>
                          <span style={{ background: '#ecfeff', color: '#0e7490', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                            📍 {agent.assigned_region || '—'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <span style={{ background: agent.parcel_count > 0 ? '#eff6ff' : '#f1f5f9', color: agent.parcel_count > 0 ? '#1d4ed8' : '#94a3b8', padding: '3px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700' }}>
                            {agent.parcel_count} parcel{agent.parcel_count !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(agent.created_at)}</td>
                        <td style={tdStyle}>
                          <button onClick={() => deleteAgent(agent.agent_id, agent.agent_name)} disabled={deletingAgentId === agent.agent_id}
                            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '0.75rem' }}>
                            {deletingAgentId === agent.agent_id ? '⏳...' : '🗑️ Delete'}
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

        {activeTab === 'users' && (
          <div style={sectionStyle}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ ...titleStyle, margin: '0 0 4px' }}>Registered Customers ({users.filter(u => u.role === 'customer').length})</h2>
              <p style={{ color: '#64748b', margin: 0, fontSize: '0.83rem' }}>Only customer accounts are shown here. Admin and courier agent accounts are managed separately.</p>
            </div>
            {users.filter(u => u.role === 'customer').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👤</div>
                <p style={{ fontWeight: '600', margin: 0 }}>No customers registered yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      {['Name', 'Email', 'Phone', 'Joined', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.role === 'customer').map((user, idx) => (
                      <tr key={user.user_id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ ...tdStyle, fontWeight: '700', color: '#0f172a' }}>{user.full_name}</td>
                        <td style={{ ...tdStyle, color: '#475569' }}>{user.email}</td>
                        <td style={{ ...tdStyle, color: '#64748b' }}>{user.phone_number || '—'}</td>
                        <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(user.created_at)}</td>
                        <td style={tdStyle}>
                          <button onClick={() => deleteUser(user.user_id, user.full_name)} disabled={deletingId === user.user_id}
                            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '0.75rem' }}>
                            {deletingId === user.user_id ? '⏳...' : '🗑️ Delete'}
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

        {activeTab === 'email' && (
          <div style={sectionStyle}>
            <h2 style={{ ...titleStyle, marginBottom: '6px' }}>Send Email Notification</h2>
            <p style={{ color: '#64748b', margin: '0 0 24px', fontSize: '0.875rem' }}>Send a manual notification to a customer about their parcel.</p>
            <div style={{ maxWidth: '560px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>RECIPIENT EMAIL</label>
                <input type="email" placeholder="customer@email.com" value={emailForm.email} onChange={e => setEmailForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>SUBJECT</label>
                <input type="text" placeholder="e.g. Your parcel has been dispatched" value={emailForm.subject} onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>MESSAGE</label>
                <textarea placeholder="Write your message to the customer..." value={emailForm.message} onChange={e => setEmailForm(f => ({ ...f, message: e.target.value }))} style={{ ...inputStyle, height: '140px', resize: 'none' }} />
              </div>
              {emailMsg && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '16px', fontWeight: '600' }}>❌ {emailMsg}</p>}
              <button onClick={sendEmail} disabled={sending} style={{ padding: '13px 32px', background: sending ? '#95d5b2' : '#52b788', color: 'white', border: 'none', borderRadius: '10px', cursor: sending ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(82,183,136,0.35)' }}>
                {sending ? '⏳ Sending...' : '📧 Send Email'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={titleStyle}>Support Tickets ({supportTickets.length})</h2>
                <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.83rem' }}>Issues reported by customers</p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: '#fefce8', color: '#a16207', border: '1px solid #fde047', borderRadius: '8px', padding: '6px 14px', fontSize: '0.78rem', fontWeight: '700' }}>
                  ⚠️ {supportTickets.filter(t => t.status === 'pending').length} pending
                </span>
                
                <button 
                  onClick={fetchSupportTickets} 
                  style={{ 
                    background: '#f1f5f9', 
                    color: '#475569', 
                    border: '1px solid #e2e8f0', 
                    padding: '6px 14px', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontWeight: '700', 
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            {supportTickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🎧</div>
                <p style={{ fontWeight: '700', margin: '0 0 8px', fontSize: '1rem', color: '#64748b' }}>No support tickets</p>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>When customers submit issues, they will appear here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {supportTickets.map((ticket) => (
                  <div key={ticket.ticket_id} style={{
                    background: ticket.status === 'resolved' ? '#f0fdf4' : 'white',
                    border: `1px solid ${ticket.status === 'resolved' ? '#bbf7d0' : '#e2e8f0'}`,
                    borderLeft: `4px solid ${ticket.status === 'resolved' ? '#22c55e' : '#f59e0b'}`,
                    borderRadius: 12,
                    padding: '18px 20px',
                    transition: 'box-shadow 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{ticket.category}</span>
                          <span style={{
                            background: ticket.status === 'resolved' ? '#dcfce7' : '#fefce8',
                            color: ticket.status === 'resolved' ? '#15803d' : '#a16207',
                            padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                            border: `1px solid ${ticket.status === 'resolved' ? '#bbf7d0' : '#fde047'}`
                          }}>
                            {ticket.status === 'resolved' ? '✅ Resolved' : '⏳ Pending'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{ticket.subject}</div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{formatDate(ticket.created_at)}</span>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', marginBottom: '12px' }}>
                      <p style={{ margin: 0, color: '#475569', fontSize: '0.85rem', lineHeight: 1.6 }}>{ticket.message}</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: '#64748b' }}>
                        <span>👤 {ticket.full_name || 'Unknown'}</span>
                        <span>📧 {ticket.user_email || 'N/A'}</span>
                        {ticket.tracking_number && (
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1b4332' }}>📦 {ticket.tracking_number}</span>
                        )}
                      </div>
                      {ticket.status !== 'resolved' && (
                        <button
                          onClick={() => resolveTicket(ticket.ticket_id)}
                          style={{ background: 'linear-gradient(135deg, #1b4332, #2d6a4f)', color: 'white', border: 'none', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem', boxShadow: '0 4px 12px rgba(27,67,50,0.25)' }}
                        >
                          ✅ Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
}

const sectionStyle = { background: 'white', padding: '28px 30px', borderRadius: '18px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' };
const titleStyle = { color: '#0f172a', margin: 0, fontSize: '1.1rem', fontWeight: '800', letterSpacing: '-0.3px' };
const labelStyle = { color: '#64748b', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.8px', display: 'block', marginBottom: '7px', textTransform: 'uppercase' };
const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: '9px', border: '2px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none', fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: '#1e293b', background: '#f8fafc', transition: 'border-color 0.2s' };
const thStyle = { padding: '12px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.7px', whiteSpace: 'nowrap' };
const tdStyle = { padding: '13px 14px', verticalAlign: 'middle', color: '#334155' };

export default AdminDashboard;