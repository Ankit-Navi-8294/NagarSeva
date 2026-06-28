import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Video, MapPin, Mic, X, Check, Loader2 } from 'lucide-react';
import { createIssue, buildPhotoSrc, type AIClassification } from '../lib/api';
import { CENTER_INDIA } from '../lib/dummyData';
import { useAuth } from '../contexts/AuthContext';

const Report: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [media, setMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [description, setDescription] = useState('');
  
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<string>('');
  const [aiResult, setAiResult] = useState<AIClassification | null>(null);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleMediaCapture = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (type === "video" && file.size > 50 * 1024 * 1024) {
        alert("Video must be under 50MB for this demo.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setMedia(ev.target.result as string);
          setMediaType(type);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) return;
      
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        setAddress(data.results[0].formatted_address);
        
        // Find city
        const ac = data.results[0].address_components;
        const cityComp = ac.find((c: any) => c.types.includes("locality") || c.types.includes("administrative_area_level_2"));
        if (cityComp) setCity(cityComp.long_name);
      }
    } catch (e) {
      console.error("Geocoding failed", e);
    }
  };

  const captureLocation = () => {
    setLocating(true);
    
    if (!navigator.geolocation) {
      setLocation(CENTER_INDIA);
      setAddress("Unknown (GPS Not Supported)");
      setLocating(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });
        setAddress(`Detecting address...`);
        reverseGeocode(lat, lng).finally(() => setLocating(false));
      },
      () => {
        setLocation(CENTER_INDIA);
        setAddress("Please enable GPS for accurate location");
        setLocating(false);
      }
    );
  };

  const handleVoiceInput = () => {
    alert("Voice input started. Speak now (Kannada/Hindi/English)...");
    setTimeout(() => {
      setDescription("There is a large pothole in the middle of the road near the market junction.");
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!media) {
      alert("Please capture a photo or video of the issue");
      return;
    }
    if (!location) {
      alert("Please click 'Use Current Location' first");
      return;
    }
    
    setSubmitting(true);
    setSubmitPhase('Uploading media to AI... (this may take 10-30s for video)');
    
    try {
      const payload = {
        title: "New Issue Report",
        description: description,
        lat: location.lat,
        lng: location.lng,
        photos: [media],
        media_type: mediaType,
        reporter_uid: user?.uid || "anonymous-citizen",
        address: address,
        city: city
      };
      
      const issue = await createIssue(payload);
      
      setSubmitPhase('Saved ✓');
      setAiResult(issue.ai_classification || null);
    } catch (error) {
      console.error(error);
      alert("Failed to submit issue. Please check the backend connection.");
      setSubmitting(false);
      setSubmitPhase('');
    }
  };

  if (aiResult) {
    return (
      <div className="flex flex-col min-h-screen bg-main" style={{ backgroundColor: 'var(--bg-main)', padding: '1.5rem' }}>
        <div className="card text-center" style={{ marginTop: '2rem' }}>
          <div style={{ width: '60px', height: '60px', backgroundColor: 'var(--status-resolved)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Check size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Report Submitted!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Our Vision AI has automatically analyzed your report.</p>
          
          <div style={{ backgroundColor: 'var(--neutral-100)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'left' }}>
            <p><strong>Detected Type:</strong> {aiResult.type}</p>
            <p><strong>Severity:</strong> {aiResult.severity}/5</p>
            <p><strong>Department:</strong> {aiResult.department}</p>
            {aiResult.auto_description && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}><em>"{aiResult.auto_description}"</em></p>
            )}
          </div>
          
          <button onClick={() => navigate('/')} className="btn btn-primary w-full mt-6">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-main" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--bg-card)', padding: '1rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--neutral-200)' }}>
        <button onClick={() => navigate('/')} className="btn" style={{ padding: '0.5rem', background: 'none' }}>
          <X size={24} />
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '1.125rem', fontWeight: 600 }}>Report Issue</h1>
        <div style={{ width: '40px' }}></div>
      </header>

      <main style={{ padding: '1.5rem', flex: 1 }}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Media Section */}
          <div className="card" style={{ padding: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>1. Capture Media</h2>
            {media ? (
              <div style={{ position: 'relative' }}>
                {mediaType === "video" ? (
                  <video src={media} controls style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                ) : (
                  <img src={media} alt="Issue" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                )}
                <button type="button" onClick={() => setMedia(null)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', padding: '0.25rem', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div onClick={() => imageInputRef.current?.click()} style={{ flex: 1, height: '120px', border: '2px dashed var(--neutral-300)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'var(--neutral-50)' }}>
                  <Camera size={32} color="var(--neutral-400)" style={{ marginBottom: '0.5rem' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Photo</span>
                </div>
                <div onClick={() => videoInputRef.current?.click()} style={{ flex: 1, height: '120px', border: '2px dashed var(--neutral-300)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'var(--neutral-50)' }}>
                  <Video size={32} color="var(--neutral-400)" style={{ marginBottom: '0.5rem' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Video</span>
                </div>
              </div>
            )}
            <input type="file" accept="image/*" capture="environment" ref={imageInputRef} style={{ display: 'none' }} onChange={(e) => handleMediaCapture(e, "image")} />
            <input type="file" accept="video/*" capture="environment" ref={videoInputRef} style={{ display: 'none' }} onChange={(e) => handleMediaCapture(e, "video")} />
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
              <button type="button" onClick={captureLocation} className="btn btn-secondary w-full" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }} disabled={locating}>
                <MapPin size={20} />
                {locating ? 'Detecting...' : 'Use Current Location'}
              </button>
            )}
          </div>

          {/* Details Section */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>3. Additional Details (Optional)</h2>
              <button type="button" onClick={handleVoiceInput} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: 'var(--primary-600)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                <Mic size={16} /> Voice
              </button>
            </div>
            <textarea className="input-field" rows={3} placeholder="Describe the issue..." value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
          </div>

          <button type="submit" className="btn btn-primary w-full mt-4" disabled={submitting || !media || !location}>
            {submitting ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loader2 size={18} className="animate-spin" /> {submitPhase}
              </div>
            ) : 'Submit Report'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default Report;

