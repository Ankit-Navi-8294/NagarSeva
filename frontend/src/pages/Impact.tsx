import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingUp, Users, CheckCircle } from 'lucide-react';

const ImpactDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--primary-600)', color: 'white', padding: '1rem', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => navigate('/')} className="btn" style={{ padding: '0.5rem', background: 'none', color: 'white' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '1.25rem', fontWeight: 700, marginRight: '2rem' }}>Civic Impact</h1>
      </header>

      <main style={{ padding: '1.5rem', flex: 1 }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
          Real-time metrics for Belagavi City
        </p>

        {/* Top KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card text-center" style={{ padding: '1rem' }}>
            <Users size={24} color="var(--primary-500)" style={{ margin: '0 auto 0.5rem' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>1,204</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Active Citizens</p>
          </div>
          <div className="card text-center" style={{ padding: '1rem' }}>
            <CheckCircle size={24} color="var(--status-resolved)" style={{ margin: '0 auto 0.5rem' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>84%</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Resolution Rate</p>
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="card mb-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Resolution Trend</h2>
            <TrendingUp size={20} color="var(--primary-500)" />
          </div>
          <div style={{ height: '150px', backgroundColor: 'var(--neutral-100)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>[ Looker Studio Line Chart Embed ]</span>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card mb-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Top Issues</h2>
            <BarChart3 size={20} color="var(--primary-500)" />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                <span>Potholes</span>
                <span>45%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: 'var(--neutral-200)', height: '8px', borderRadius: '4px' }}>
                <div style={{ width: '45%', backgroundColor: 'var(--primary-500)', height: '100%', borderRadius: '4px' }}></div>
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                <span>Garbage</span>
                <span>30%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: 'var(--neutral-200)', height: '8px', borderRadius: '4px' }}>
                <div style={{ width: '30%', backgroundColor: 'var(--severity-high)', height: '100%', borderRadius: '4px' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                <span>Water Leakage</span>
                <span>25%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: 'var(--neutral-200)', height: '8px', borderRadius: '4px' }}>
                <div style={{ width: '25%', backgroundColor: 'var(--primary-300)', height: '100%', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default ImpactDashboard;
