import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCcw, Camera, Video, AlertTriangle } from 'lucide-react';
import { fetchIssues, buildPhotoSrc, updateIssueStatus, type Issue } from '../lib/api';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  
  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'nagarseva_admin') {
      sessionStorage.setItem('admin_auth', 'true');
      setIsAuthenticated(true);
      loadData();
    } else {
      alert("Invalid admin password");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchIssues();
      setIssues(data);
    } catch (e) {
      console.error(e);
      alert("Failed to fetch data from backend");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (issueId: string, newStatus: string) => {
    try {
      await updateIssueStatus(issueId, newStatus);
      // Optimistic update
      setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: newStatus } : i));
    } catch (e) {
      console.error(e);
      alert("Failed to update status");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-main" style={{ backgroundColor: 'var(--bg-main)' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>Admin Portal Access</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Enter admin password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">Login</button>
          </form>
          <button onClick={() => navigate('/')} className="btn w-full mt-4" style={{ backgroundColor: 'transparent', color: 'var(--text-secondary)' }}>Back to App</button>
        </div>
      </div>
    );
  }

  // Calculate KPIs
  const total = issues.length;
  const reported = issues.filter(i => i.status === 'Reported').length;
  const inProgress = issues.filter(i => i.status === 'In Progress').length;
  const resolved = issues.filter(i => i.status === 'Resolved').length;

  const filteredIssues = issues.filter(i => {
    const statusMatch = statusFilter === 'All' || i.status === statusFilter;
    const typeMatch = typeFilter === 'All' || i.type === typeFilter;
    const deptMatch = deptFilter === 'All' || i.department === deptFilter;
    return statusMatch && typeMatch && deptMatch;
  });

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--neutral-100)' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--neutral-900)', color: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>NagarSeva Admin Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={loadData} className="btn" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--neutral-800)', color: 'white', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={() => { sessionStorage.removeItem('admin_auth'); setIsAuthenticated(false); }} className="btn" style={{ padding: '0.5rem', backgroundColor: 'transparent', color: 'var(--severity-critical)' }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main style={{ padding: '2rem', flex: 1, maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--neutral-500)' }}>
            <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Issues</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>{total}</p>
          </div>
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--severity-critical)' }}>
            <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>New (Reported)</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>{reported}</p>
          </div>
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--severity-medium)' }}>
            <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>In Progress</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>{inProgress}</p>
          </div>
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--status-resolved)' }}>
            <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Resolved</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>{resolved}</p>
          </div>
        </div>

        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neutral-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Issue Reports</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <select className="input-field" style={{ width: '150px' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="All">All Types</option>
                <option value="Pothole">Pothole</option>
                <option value="Garbage">Garbage</option>
                <option value="Water Leakage">Water Leakage</option>
                <option value="Broken Streetlight">Broken Streetlight</option>
                <option value="Other">Other</option>
              </select>
              <select className="input-field" style={{ width: '150px' }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                <option value="All">All Departments</option>
                <option value="PWD">PWD</option>
                <option value="BBMP">BBMP</option>
                <option value="BWSSB">BWSSB</option>
                <option value="BESCOM">BESCOM</option>
                <option value="Other">Other</option>
              </select>
              <select className="input-field" style={{ width: '150px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Reported">Reported</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--neutral-50)', borderBottom: '2px solid var(--neutral-200)' }}>
                  <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Media</th>
                  <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>AI Classification</th>
                  <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Location</th>
                  <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Reporter</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map(issue => (
                  <tr key={issue.id} style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                    <td style={{ padding: '1rem', verticalAlign: 'top', width: '200px' }}>
                      {issue.photos && issue.photos.length > 0 ? (
                        issue.media_type === "video" ? (
                          <div style={{ position: 'relative' }}>
                            <video src={issue.photos[0]} controls style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: '120px', backgroundColor: 'black' }} />
                            <span style={{ position: 'absolute', top: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Video size={12} /> Video
                            </span>
                          </div>
                        ) : (
                          <div style={{ position: 'relative' }}>
                            <img src={buildPhotoSrc(issue.photos[0], issue.media_type || 'image')} alt="Issue" style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: '120px', objectFit: 'cover' }} />
                            <span style={{ position: 'absolute', top: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Camera size={12} /> Image
                            </span>
                          </div>
                        )
                      ) : (
                        <div style={{ width: '100%', height: '100px', backgroundColor: 'var(--neutral-100)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <AlertTriangle color="var(--neutral-400)" />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)' }}>
                          {issue.type}
                        </span>
                        <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, backgroundColor: issue.severity >= 4 ? 'var(--severity-critical)' : 'var(--severity-medium)', color: issue.severity >= 4 ? 'white' : 'black' }}>
                          Sev: {issue.severity}
                        </span>
                        <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'var(--neutral-200)', color: 'var(--neutral-700)' }}>
                          {issue.department}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <strong>AI Note:</strong> {issue.auto_description || issue.description || "No description provided."}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginTop: '0.5rem' }}>
                        {new Date(issue.created_at).toLocaleString()}
                      </p>
                    </td>
                    <td style={{ padding: '1rem', verticalAlign: 'top', width: '250px' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{issue.city || "Unknown City"}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{issue.address}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--primary-500)', marginTop: '0.5rem' }}>{issue.lat.toFixed(4)}, {issue.lng.toFixed(4)}</p>
                    </td>
                    <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                      <select 
                        className="input-field" 
                        value={issue.status} 
                        onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                        style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                      >
                        <option value="Reported">Reported</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                    <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{issue.reporter_uid}</p>
                    </td>
                  </tr>
                ))}
                
                {filteredIssues.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No issues found matching the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;

