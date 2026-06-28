import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, PlusCircle, User as UserIcon, LogOut, Award, Star, Home } from 'lucide-react';
import { fetchIssues, type Issue } from '../lib/api';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues().then(data => {
      // Filter by the current user
      if (user?.uid) {
        setIssues(data.filter(issue => issue.reporter_uid === user.uid));
      } else {
        setIssues([]);
      }
      setLoading(false);
    }).catch(console.error);
  }, [user]);

  const resolvedCount = issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;
  const civicPoints = issues.length * 10 + resolvedCount * 20;
  
  // Find the most recent city the user reported from
  const recentIssueWithCity = issues.find(i => i.city);
  const citySubtitle = recentIssueWithCity ? `${recentIssueWithCity.city} Citizen` : "NagarSeva Citizen";

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
      <main style={{ flex: 1, padding: '1rem', paddingBottom: '80px' }}>
        <div className="card mb-4 text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <UserIcon size={40} color="var(--primary-600)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{user?.phoneNumber || "Citizen"}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{loading ? "Loading..." : citySubtitle}</p>
          
          <button onClick={() => navigate('/impact')} className="btn btn-primary mt-4 w-full" style={{ display: 'flex', gap: '0.5rem' }}>
            <Star size={18} /> View National Impact
          </button>
        </div>

        {/* Gamification Stats */}
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>My Impact</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card text-center" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-600)' }}>{loading ? "-" : civicPoints}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Civic Points</p>
          </div>
          <div className="card text-center" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-resolved)' }}>{loading ? "-" : resolvedCount}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Issues Resolved</p>
          </div>
        </div>

        {/* Badges */}
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Badges</h3>
        <div className="card" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px', opacity: issues.length > 0 ? 1 : 0.5 }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: issues.length > 0 ? 'var(--severity-medium)' : 'var(--neutral-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <Award size={30} color={issues.length > 0 ? "white" : "var(--neutral-500)"} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, textAlign: 'center' }}>Reporter</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px', opacity: resolvedCount >= 5 ? 1 : 0.5 }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: resolvedCount >= 5 ? 'var(--primary-400)' : 'var(--neutral-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <Award size={30} color={resolvedCount >= 5 ? "white" : "var(--neutral-500)"} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, textAlign: 'center' }}>Consistent Citizen</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px', opacity: resolvedCount >= 10 ? 1 : 0.5 }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: resolvedCount >= 10 ? 'var(--status-resolved)' : 'var(--neutral-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <Award size={30} color={resolvedCount >= 10 ? "white" : "var(--neutral-500)"} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, textAlign: 'center' }}>Civic Hero</span>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--neutral-200)', display: 'flex', justifyContent: 'space-around', padding: '0.75rem', position: 'fixed', bottom: 0, left: 0, right: 0 }}>
        <button onClick={() => navigate('/')} className="flex flex-col items-center gap-2" style={{ color: 'var(--neutral-500)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <Home size={24} />
          <span style={{ fontSize: '0.75rem' }}>Home</span>
        </button>
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

