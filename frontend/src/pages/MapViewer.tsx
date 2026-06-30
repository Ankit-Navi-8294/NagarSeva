import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, MarkerClusterer, Marker, HeatmapLayer } from '@react-google-maps/api';
import { ArrowLeft, Layers } from 'lucide-react';
import { CENTER_INDIA } from '../lib/dummyData';
import { fetchIssues, type Issue } from '../lib/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const libraries: ("visualization" | "places" | "drawing" | "geometry")[] = ["visualization"];

const MapViewer: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'cluster' | 'heatmap'>('cluster');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY",
    libraries: libraries
  });

  useEffect(() => {
    fetchIssues().then(setIssues).catch(console.error);
    
    // Get user's actual location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          console.warn("Geolocation access denied or failed.");
        }
      );
    }
  }, []);

  const getMarkerIcon = (severity: number) => {
    let color = 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    if (severity >= 4) color = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    else if (severity >= 3) color = 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png';
    return color;
  };

  const heatmapData = useMemo(() => {
    if (!isLoaded) return [];
    return issues.map(issue => ({
      location: new window.google.maps.LatLng(issue.lat, issue.lng),
      weight: issue.severity
    }));
  }, [isLoaded, issues]);

  if (loadError) return <div className="flex items-center justify-center h-screen">Error loading maps. Check your API key.</div>;
  if (!isLoaded) return <div className="flex items-center justify-center h-screen">Loading Map...</div>;

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* Header Overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
        <button onClick={() => navigate('/')} className="btn" style={{ padding: '0.5rem', backgroundColor: 'var(--bg-card)', borderRadius: '50%', boxShadow: 'var(--shadow-md)', pointerEvents: 'auto' }}>
          <ArrowLeft size={24} color="var(--primary-600)" />
        </button>
        
        <button onClick={() => setViewMode(viewMode === 'cluster' ? 'heatmap' : 'cluster')} className="btn" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-md)', pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--primary-600)' }}>
          <Layers size={18} />
          {viewMode === 'cluster' ? 'Show Heatmap' : 'Show Markers'}
        </button>
      </div>

      <div style={{ flex: 1 }}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={userLocation || CENTER_INDIA}
          zoom={userLocation ? 13 : 5}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            styles: [ { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] } ]
          }}
        >
          {userLocation && (
            <Marker 
              position={userLocation} 
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 7,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 2,
              }}
              title="You are here" 
            />
          )}

          {viewMode === 'heatmap' && (
            <HeatmapLayer data={heatmapData} options={{ radius: 40, opacity: 0.8 }} />
          )}

          {viewMode === 'cluster' && (
            <MarkerClusterer>
              {(clusterer) => (
                <>
                  {issues.map((issue) => (
                    <Marker
                      key={issue.id}
                      position={{ lat: issue.lat, lng: issue.lng }}
                      clusterer={clusterer}
                      icon={getMarkerIcon(issue.severity)}
                      onClick={() => alert(`Issue: ${issue.type}\nSeverity: ${issue.severity}\nStatus: ${issue.status}`)}
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

