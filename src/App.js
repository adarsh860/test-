import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaWifi, 
  FaSignal, 
  FaChartLine, 
  FaBolt, 
  FaMapMarkerAlt, 
  FaTable,
  FaSync,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import './App.css';

function App() {
  const [beacons, setBeacons] = useState([]);
  const [summary, setSummary] = useState({});
  const [gatewayInfo, setGatewayInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const API_BASE_URL = 'http://localhost:5000';

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [beaconsResponse, summaryResponse, gatewayResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/beacons`),
        axios.get(`${API_BASE_URL}/api/summary`),
        axios.get(`${API_BASE_URL}/api/gateway-info`)
      ]);

      setBeacons(beaconsResponse.data.beacons || []);
      setSummary(summaryResponse.data || {});
      setGatewayInfo(gatewayResponse.data || {});
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data from server. Please check if the API is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up real-time updates every 5 seconds
    const interval = setInterval(fetchData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getSignalStrengthClass = (rssi) => {
    if (rssi >= -60) return 'good';
    if (rssi >= -70) return 'warning';
    return 'critical';
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'active';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'critical';
      default:
        return 'active';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const formatRSSI = (rssi) => {
    if (rssi === null || rssi === undefined) return 'N/A';
    return `${rssi} dBm`;
  };

  if (loading && beacons.length === 0) {
    return (
      <div className="container">
        <div className="loading">
          <FaSync className="icon" style={{ animation: 'spin 1s linear infinite' }} />
          <p>Loading beacon data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>LoRaWAN Beacon Monitor</h1>
        <p>Real-time monitoring of LoRaWAN gateway and detected beacons</p>
        {lastUpdate && (
          <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      {error && (
        <div className="error">
          <FaExclamationTriangle style={{ marginRight: '10px' }} />
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <FaWifi className="icon" />
          <h3>Active Beacons</h3>
          <div className="value">{summary.active_beacons || beacons.length || 0}</div>
          <div className="unit">devices</div>
        </div>

        <div className="summary-card">
          <FaSignal className="icon" />
          <h3>Gateway RSSI</h3>
          <div className="value">{formatRSSI(summary.avg_gateway_rssi || gatewayInfo.rssi)}</div>
          <div className="unit">signal strength</div>
        </div>

        <div className="summary-card">
          <FaChartLine className="icon" />
          <h3>Frame Count</h3>
          <div className="value">{summary.total_frame_count || 0}</div>
          <div className="unit">total frames</div>
        </div>

        <div className="summary-card">
          <FaBolt className="icon" />
          <h3>SNR</h3>
          <div className="value">{summary.avg_snr ? `${summary.avg_snr.toFixed(1)} dB` : 'N/A'}</div>
          <div className="unit">signal-to-noise ratio</div>
        </div>
      </div>

      {/* Gateway Information */}
      {gatewayInfo.gateway_id && (
        <div className="info-section">
          <h2>
            <FaMapMarkerAlt className="icon" />
            Gateway Information
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <strong>Gateway ID:</strong> {gatewayInfo.gateway_id}
            </div>
            <div>
              <strong>Location:</strong> {gatewayInfo.latitude}, {gatewayInfo.longitude}
            </div>
            <div>
              <strong>Channel:</strong> Channel {gatewayInfo.channel || 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Beacon Table */}
      <div className="info-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>
            <FaTable className="icon" />
            Detected Beacons
          </h2>
          <button 
            className="refresh-button" 
            onClick={fetchData}
            disabled={loading}
          >
            <FaSync style={{ marginRight: '5px' }} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {beacons.length > 0 ? (
          <table className="beacon-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>MAC Address</th>
                <th>Signal Strength</th>
                <th>Last Seen</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {beacons.map((beacon, index) => (
                <tr key={`${beacon.mac_address}-${index}`}>
                  <td>Beacon #{index + 1}</td>
                  <td>{beacon.mac_address || 'N/A'}</td>
                  <td>
                    <span className={`signal-strength ${getSignalStrengthClass(beacon.beacon_rssi)}`}>
                      {formatRSSI(beacon.beacon_rssi)}
                    </span>
                  </td>
                  <td>{formatDateTime(beacon.last_seen)}</td>
                  <td>
                    <span className={`status ${getStatusClass(beacon.status)}`}>
                      {beacon.status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <FaTimesCircle style={{ fontSize: '3rem', marginBottom: '10px', color: '#ccc' }} />
            <p>No beacon data available</p>
          </div>
        )}
      </div>

      <div className="footer">
        <p>
          Device: {beacons[0]?.device_name || 'N/A'} | 
          Application: {beacons[0]?.application_name || 'N/A'}
        </p>
      </div>
    </div>
  );
}

export default App; 