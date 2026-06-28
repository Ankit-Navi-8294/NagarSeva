import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { fetchIssues, type Issue } from '../lib/api';

const ImpactDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues().then(data => {
      setIssues(data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  // Compute live metrics
  const totalIssues = issues.length;
  const resolvedIssues = issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;
  const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;
  
  // Aggregate types
  const typeCounts: Record<string, number> = {};
  issues.forEach(i => {
    typeCounts[i.type] = (typeCounts[i.type] || 0) + 1;
  });
  
  // Sort types by count
  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  
  // Hardcoded citizens metric for demo (could be derived from unique reporter_uids)
  const activeCitizens = new Set(issues.map(i => i.reporter_uid)).size;

  const getTypeColor = (index: number) => {
    if (index === 0) return 'var(--primary-500)';
    if (index === 1) return 'var(--severity-high)';
    return 'var(--primary-300)';
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--primary-600)', color: 'white', padding: '1rem', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => navigate('/')} className="btn" style={{ padding: '0.5rem', background: 'none', color: 'white' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '1.25rem', fontWeight: 700, marginRight: '2rem' }}>National Impact</h1>
      </header>

      <main style={{ padding: '1.5rem', flex: 1 }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
          Real-time metrics across India
        </p>

        {loading ? (
          <div className="flex justify-center"><div className="animate-spin" style={{ width: '24px', height: '24px', border: '3px solid var(--neutral-200)', borderTopColor: 'var(--primary-600)', borderRadius: '50%' }}></div></div>
        ) : (
          <>
            {/* Top KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="card text-center" style={{ padding: '1rem' }}>
                <Users size={24} color="var(--primary-500)" style={{ margin: '0 auto 0.5rem' }} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activeCitizens > 0 ? activeCitizens : 1}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Active Reporters</p>
              </div>
              <div className="card text-center" style={{ padding: '1rem' }}>
                <CheckCircle size={24} color="var(--status-resolved)" style={{ margin: '0 auto 0.5rem' }} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{resolutionRate}%</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Resolution Rate</p>
              </div>
            </div>

            {/* Charts Placeholder */}
            <div className="card mb-4">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Total Issues</h2>
                <TrendingUp size={20} color="var(--primary-500)" />
              </div>
              <div style={{ height: '150px', backgroundColor: 'var(--neutral-100)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                 <h1 style={{fontSize: '3rem', fontWeight: 700, color: 'var(--primary-600)'}}>{totalIssues}</h1>
                 <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Reports Submitted</span>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="card mb-4">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Top Issues</h2>
                <BarChart3 size={20} color="var(--primary-500)" />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sortedTypes.length > 0 ? sortedTypes.map(([type, count], index) => {
                  const percentage = Math.round((count / totalIssues) * 100);
                  return (
                    <div key={type}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <span>{type}</span>
                        <span>{percentage}%</span>
                      </div>
                      <div style={{ width: '100%', backgroundColor: 'var(--neutral-200)', height: '8px', borderRadius: '4px' }}>
                        <div style={{ width: `${percentage}%`, backgroundColor: getTypeColor(index), height: '100%', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  );
                }) : (
                  <p style={{textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem'}}>No data available yet</p>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ImpactDashboard;

