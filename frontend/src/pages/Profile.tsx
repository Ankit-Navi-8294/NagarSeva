import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, PlusCircle, User as UserIcon, LogOut, Award, Star } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--bg-card)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--neutral-200)' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>My Profile</h1>
        <button onClick={logout} className="btn" style={{ padding: '0.5rem', background: 'none', color: 'var(--severity-critical)' }}>
          <LogOut size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '1rem' }}>
        <div className="card mb-4 text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <UserIcon size={40} color="var(--primary-600)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{user?.phoneNumber}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Belagavi Citizen</p>
          
          <button onClick={() => navigate('/impact')} className="btn btn-primary mt-4 w-full" style={{ display: 'flex', gap: '0.5rem' }}>
            <Star size={18} /> View City Impact
          </button>
        </div>

        {/* Gamification Stats */}
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>My Impact</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card text-center" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-600)' }}>120</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Civic Points</p>
          </div>
          <div className="card text-center" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-resolved)' }}>5</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Issues Resolved</p>
          </div>
        </div>

        {/* Badges */}
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Badges</h3>
        <div className="card" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--severity-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <Award size={30} color="white" />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, textAlign: 'center' }}>Road Warrior</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <Award size={30} color="white" />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, textAlign: 'center' }}>Consistent Citizen</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px', opacity: 0.5 }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--neutral-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <Award size={30} color="var(--neutral-500)" />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, textAlign: 'center' }}>Water Watcher</span>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--neutral-200)', display: 'flex', justifyContent: 'space-around', padding: '0.75rem', position: 'sticky', bottom: 0 }}>
        <button onClick={() => navigate('/map')} className="flex flex-col items-center gap-2" style={{ color: 'var(--neutral-500)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <MapPin size={24} />
          <span style={{ fontSize: '0.75rem' }}>Map</span>
        </button>
        <button onClick={() => navigate('/report')} className="flex flex-col items-center gap-2" style={{ color: 'var(--neutral-500)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <PlusCircle size={24} />
          <span style={{ fontSize: '0.75rem' }}>Report</span>
        </button>
        <button className="flex flex-col items-center gap-2" style={{ color: 'var(--primary-600)', background: 'none', border: 'none' }}>
          <UserIcon size={24} />
          <span style={{ fontSize: '0.75rem' }}>Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default Profile;
