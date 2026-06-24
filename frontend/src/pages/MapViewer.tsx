import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, MarkerClusterer, Marker, HeatmapLayer } from '@react-google-maps/api';
import { ArrowLeft, Layers } from 'lucide-react';
import { MOCK_ISSUES, CENTER_BELAGAVI } from '../lib/dummyData';

const containerStyle = {
  width: '100%',
  height: '100%'
};

// We must include the 'visualization' library for HeatmapLayer
const libraries: ("visualization" | "places" | "drawing" | "geometry")[] = ["visualization"];

const MapViewer: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'cluster' | 'heatmap'>('cluster');

  // Replace with actual API key via env vars
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY",
    libraries: libraries
  });

  const getMarkerIcon = (severity: number) => {
    // Red=Critical(5), Orange=High(3-4), Yellow=Medium(1-2)
    let color = 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    if (severity >= 4) color = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    else if (severity >= 3) color = 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png';
    return color;
  };

  const heatmapData = useMemo(() => {
    if (!isLoaded) return [];
    return MOCK_ISSUES.map(issue => ({
      location: new window.google.maps.LatLng(issue.lat, issue.lng),
      weight: issue.severity // Higher severity = hotter spot
    }));
  }, [isLoaded]);

  if (loadError) {
    return <div className="flex items-center justify-center h-screen">Error loading maps. Check your API key.</div>;
  }

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-screen">Loading Map...</div>;
  }

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* Header Overlay (floating above map) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
        <button 
          onClick={() => navigate('/')} 
          className="btn" 
          style={{ padding: '0.5rem', backgroundColor: 'var(--bg-card)', borderRadius: '50%', boxShadow: 'var(--shadow-md)', pointerEvents: 'auto' }}
        >
          <ArrowLeft size={24} color="var(--primary-600)" />
        </button>
        
        <button 
          onClick={() => setViewMode(viewMode === 'cluster' ? 'heatmap' : 'cluster')} 
          className="btn" 
          style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-md)', pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--primary-600)' }}
        >
          <Layers size={18} />
          {viewMode === 'cluster' ? 'Show Heatmap' : 'Show Markers'}
        </button>
      </div>

      <div style={{ flex: 1 }}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={CENTER_BELAGAVI}
          zoom={14}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            styles: [
              // Slightly cleaner style for civic map
              { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
            ]
          }}
        >
          {viewMode === 'heatmap' && (
            <HeatmapLayer
              data={heatmapData}
              options={{
                radius: 40,
                opacity: 0.8
              }}
            />
          )}

          {viewMode === 'cluster' && (
            <MarkerClusterer>
              {(clusterer) => (
                <>
                  {MOCK_ISSUES.map((issue) => (
                    <Marker
                      key={issue.id}
                      position={{ lat: issue.lat, lng: issue.lng }}
                      clusterer={clusterer}
                      icon={getMarkerIcon(issue.severity)}
                      onClick={() => alert(`Issue: ${issue.title}\nSeverity: ${issue.severity}`)}
                    />
                  ))}
                </>
              )}
            </MarkerClusterer>
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export default MapViewer;
