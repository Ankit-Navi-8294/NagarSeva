import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, MapPin, PlusCircle, User as UserIcon, AlertCircle } from 'lucide-react';
import { fetchIssues, buildPhotoSrc, type Issue, upvoteIssue } from '../lib/api';

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const categories = ['All', 'Pothole', 'Garbage', 'Water Leakage', 'Broken Streetlight', 'Other'];

  useEffect(() => {
    const loadIssues = async () => {
      try {
        const data = await fetchIssues();
        setIssues(data);
      } catch (err: any) {
        setError(err.message || "Failed to load issues");
      } finally {
        setLoading(false);
      }
    };
    loadIssues();
  }, []);

  const handleUpvote = async (id: string) => {
    try {
      const { upvote_count } = await upvoteIssue(id);
      setIssues(issues.map(issue => issue.id === id ? { ...issue, upvote_count } : issue));
    } catch (err) {
      console.error("Failed to upvote", err);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  };

  const getSeverityColor = (sev: number) => {
    if (sev >= 4) return 'var(--severity-critical)';
    if (sev >= 3) return 'var(--severity-high)';
    return 'var(--severity-medium)';
  };

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
      <main style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--bg-main)', overflowY: 'auto', paddingBottom: '80px' }}>
        <div className="card mb-4 text-center">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Welcome back</p>
          <p style={{ fontWeight: 600, fontSize: '1.125rem' }}>{user?.phoneNumber || "Citizen"}</p>
        </div>

        {/* Category Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                whiteSpace: 'nowrap',
                fontWeight: 600,
                fontSize: '0.875rem',
                border: '1px solid',
                backgroundColor: selectedCategory === cat ? 'var(--primary-600)' : 'transparent',
                color: selectedCategory === cat ? 'white' : 'var(--neutral-700)',
                borderColor: selectedCategory === cat ? 'var(--primary-600)' : 'var(--neutral-300)',
                cursor: 'pointer'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Nearby Issues</h2>
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading issues...</p>
          </div>
        )}

        {!loading && error && (
          <div className="card text-center py-8" style={{ color: 'var(--severity-high)' }}>
            <AlertCircle className="mx-auto mb-2" size={32} />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && issues.length === 0 && (
          <div className="card text-center py-8">
            <p style={{ color: 'var(--text-secondary)' }}>No issues reported yet. Be the first!</p>
          </div>
        )}

        {!loading && !error && (selectedCategory === 'All' ? issues : issues.filter(i => i.type === selectedCategory)).map((issue) => (
          <div key={issue.id} className="card mb-4" style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--neutral-200)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {issue.photos && issue.photos.length > 0 && issue.media_type === 'image' ? (
                <img src={buildPhotoSrc(issue.photos[0], 'image')} alt={issue.type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : issue.photos && issue.photos.length > 0 && issue.media_type === 'video' ? (
                <video src={buildPhotoSrc(issue.photos[0], 'video')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : null}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: getSeverityColor(issue.severity) }}>{issue.type}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{getTimeAgo(issue.created_at)}</span>
              </div>
              <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>{issue.title || issue.auto_description || issue.description || 'No description provided.'}</p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)' }}>{issue.status}</span>
                <button 
                  onClick={() => handleUpvote(issue.id)}
                  style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--neutral-200)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                >
                  {issue.upvote_count} Upvotes
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Bottom Navigation */}
      <nav style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--neutral-200)', display: 'flex', justifyContent: 'space-around', padding: '0.75rem', position: 'fixed', bottom: 0, left: 0, right: 0 }}>
        <button onClick={() => navigate('/')} className="flex flex-col items-center gap-2" style={{ color: 'var(--primary-600)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <MapPin size={24} />
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
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-2" style={{ color: 'var(--neutral-500)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <UserIcon size={24} />
          <span style={{ fontSize: '0.75rem' }}>Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default Home;

