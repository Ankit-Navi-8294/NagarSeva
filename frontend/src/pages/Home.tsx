import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, MapPin, PlusCircle, User as UserIcon } from 'lucide-react';

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header style={{ backgroundColor: 'var(--primary-600)', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>NagarSeva</h1>
        <button onClick={logout} className="btn" style={{ padding: '0.5rem', backgroundColor: 'transparent', color: 'white' }}>
          <LogOut size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--bg-main)' }}>
        <div className="card mb-4 text-center">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Welcome back</p>
          <p style={{ fontWeight: 600, fontSize: '1.125rem' }}>{user?.phoneNumber}</p>
        </div>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Nearby Issues</h2>
        
        {/* Mock Issue Card */}
        <div className="card mb-4" style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--neutral-200)', borderRadius: 'var(--radius-md)' }}></div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--severity-high)' }}>Pothole</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>2h ago</span>
            </div>
            <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Deep pothole near Main Street junction.</p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)' }}>Reported</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>12 Upvotes</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--neutral-200)', display: 'flex', justifyContent: 'space-around', padding: '0.75rem', position: 'sticky', bottom: 0 }}>
        <button onClick={() => navigate('/map')} className="flex flex-col items-center gap-2" style={{ color: 'var(--primary-600)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <MapPin size={24} />
          <span style={{ fontSize: '0.75rem' }}>Map</span>
        </button>
        <button onClick={() => navigate('/report')} className="flex flex-col items-center gap-2" style={{ color: 'var(--neutral-500)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <PlusCircle size={24} />
          <span style={{ fontSize: '0.75rem' }}>Report</span>
        </button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-2" style={{ color: 'var(--neutral-500)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <UserIcon size={24} />
          <span style={{ fontSize: '0.75rem' }}>Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default Home;
