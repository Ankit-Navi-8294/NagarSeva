import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const { setupRecaptcha, requestOTP, verifyOTP, user, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (step === 'PHONE') {
      setupRecaptcha('recaptcha-container');
    }
  }, [step, setupRecaptcha]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setLoading(true);
    try {
      // In a real app, validate phone format (+91...)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      await requestOTP(formattedPhone);
      setStep('OTP');
    } catch (err) {
      // Error is handled by context, but we can do local state here too
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    try {
      await verifyOTP(otp);
      navigate('/');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ padding: '1.5rem' }}>
      <div className="card w-full" style={{ maxWidth: '400px' }}>
        <h1 className="text-center mb-4" style={{ color: 'var(--primary-600)', fontSize: '1.5rem', fontWeight: 700 }}>
          NagarSeva
        </h1>
        <p className="text-center mb-4" style={{ color: 'var(--text-secondary)' }}>
          Log in to report civic issues
        </p>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {step === 'PHONE' ? (
          <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
            <div>
              <label htmlFor="phone" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                className="input-field"
                placeholder="+91 98765 43210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
            <div id="recaptcha-container"></div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
            <div>
              <label htmlFor="otp" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Enter OTP
              </label>
              <input
                id="otp"
                type="text"
                className="input-field"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary mt-4" 
              onClick={() => setStep('PHONE')}
              disabled={loading}
            >
              Back
            </button>
          </form>
        )}
        
        {/* Quick Access */}
        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--neutral-200)' }}>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>Quick Access</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button onClick={() => navigate('/report')} className="btn w-full" style={{ padding: '0.75rem', backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', border: '1px solid var(--primary-200)', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
              Report Issue (Anonymous)
            </button>
            <button onClick={() => navigate('/admin')} className="btn w-full" style={{ padding: '0.75rem', backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-700)', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
              Admin Dashboard
            </button>
            
            {/* Dev Bypass for testing */}
            <button 
              onClick={() => {
                (window as any)._bypassAuth = true;
                navigate('/');
              }} 
              style={{ marginTop: '1rem', padding: '0.5rem', width: '100%', border: '1px dashed #ccc', background: 'transparent', fontSize: '0.75rem', color: 'var(--text-secondary)' }}
            >
              [DEV] Bypass Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

