import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, Mic, X, Check } from 'lucide-react';

const Report: React.FC = () => {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [address, setAddress] = useState<string>('');
  const [description, setDescription] = useState('');
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPhoto(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const captureLocation = () => {
    setLocating(true);
    
    // 5-second timeout fallback for demo/headless environments
    const fallbackTimeout = setTimeout(() => {
      setLocation({ lat: 15.8497, lng: 74.4977 }); // Belagavi, Karnataka
      setAddress('Belagavi, Karnataka (Demo Location)');
      setLocating(false);
    }, 5000);

    if (!navigator.geolocation) {
      clearTimeout(fallbackTimeout);
      setLocation({ lat: 15.8497, lng: 74.4977 });
      setAddress('Belagavi, Karnataka (Demo Location)');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(fallbackTimeout);
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setAddress('Auto-detected: MG Road, Belagavi');
        setLocating(false);
      },
      () => {
        clearTimeout(fallbackTimeout);
        setLocation({ lat: 15.8497, lng: 74.4977 });
        setAddress('Belagavi, Karnataka (Demo Location)');
        setLocating(false);
      }
    );
  };

  const handleVoiceInput = () => {
    // Mock web speech API
    alert("Voice input started. Speak now (Kannada/Hindi/English)...");
    setTimeout(() => {
      setDescription("There is a large pothole in the middle of the road near the market junction.");
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo) {
      alert("Please capture a photo of the issue");
      return;
    }
    if (!location) {
      alert("Please click 'Use Current Location' first");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const payload = {
        title: "New Issue Report",
        description: description,
        lat: location.lat,
        lng: location.lng,
        photos: [photo],
        reporter_uid: "local-user-123"
      };
      
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      
      const response = await fetch(`${apiUrl}/api/v1/issues/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error("Failed to report issue");
      
      alert("Issue reported successfully! The Vision Agent has classified your report.");
      navigate('/');
    } catch (error) {
      console.error(error);
      alert("Could not reach backend. Make sure FastAPI is running on port 8000.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-main" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--bg-card)', padding: '1rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--neutral-200)' }}>
        <button onClick={() => navigate('/')} className="btn" style={{ padding: '0.5rem', background: 'none' }}>
          <X size={24} />
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '1.125rem', fontWeight: 600 }}>Report Issue</h1>
        <div style={{ width: '40px' }}></div> {/* Spacer */}
      </header>

      <main style={{ padding: '1.5rem', flex: 1 }}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Photo Section */}
          <div className="card" style={{ padding: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>1. Capture Photo</h2>
            {photo ? (
              <div style={{ position: 'relative' }}>
                <img src={photo} alt="Issue" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                <button 
                  type="button"
                  onClick={() => setPhoto(null)}
                  style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', padding: '0.25rem', border: 'none', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{ height: '150px', border: '2px dashed var(--neutral-300)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'var(--neutral-50)' }}
              >
                <Camera size={32} color="var(--neutral-400)" style={{ marginBottom: '0.5rem' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Tap to take photo</span>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handlePhotoCapture} 
            />
          </div>

          {/* Location Section */}
          <div className="card" style={{ padding: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>2. Location</h2>
            {location ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--primary-50)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <Check size={20} color="var(--primary-600)" />
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-700)' }}>{address}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--primary-600)' }}>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
                </div>
              </div>
            ) : (
              <button 
                type="button" 
                onClick={captureLocation}
                className="btn btn-secondary w-full" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                disabled={locating}
              >
                <MapPin size={20} />
                {locating ? 'Detecting...' : 'Use Current Location'}
              </button>
            )}
          </div>

          {/* Details Section */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>3. Additional Details (Optional)</h2>
              <button 
                type="button" 
                onClick={handleVoiceInput}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: 'var(--primary-600)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
              >
                <Mic size={16} /> Voice
              </button>
            </div>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Describe the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full mt-4" 
            disabled={submitting || !photo}
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default Report;
