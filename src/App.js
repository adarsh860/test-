import React, { useState, useEffect } from 'react';
import { 
  FaTable,
  FaSync,
  FaTimesCircle
} from 'react-icons/fa';
import './App.css';

function App() {
  const [beacons, setBeacons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [timeRange, setTimeRange] = useState(2); // default 2 min

  // Fetch beacons from backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://192.168.1.14:5000/sql?minutes=${timeRange}`);
      const data = await response.json();
      setBeacons(data.beacons || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching beacon data:", error);
      setBeacons([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // auto-refresh every 10 sec
    return () => clearInterval(interval);
  }, [timeRange]); // refetch when timeRange changes

  // Class styling based on RSSI
  const getSignalStrengthClass = (rssi) => {
    if (rssi >= -45) return 'good';
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
      case 'new':
        return 'new';
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

  return (
    <div className="container">
      <div className="header">
        <h1>LoRaWAN Beacon Monitor</h1>
        {lastUpdate && (
          <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="info-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>
            <FaTable className="icon" />
            Detected Beacons
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(Number(e.target.value))}
              style={{ padding: '8px', borderRadius: '5px' }}
            >
              <option value={2}>Last 2 min</option>
              <option value={5}>Last 5 min</option>
              <option value={10}>Last 10 min</option>
            </select>

            <button 
              className="refresh-button" 
              onClick={fetchData}
              disabled={loading}
            >
              <FaSync style={{ marginRight: '5px' }} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
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
                <tr key={beacon.mac_address}>
                  <td>{beacon.device_name || `Beacon #${index + 1}`}</td>
                  <td>{beacon.mac_address}</td>
                  <td>
                    <span className={`signal-strength ${getSignalStrengthClass(beacon.beacon_rssi)}`}>
                      {formatRSSI(beacon.beacon_rssi)}
                    </span>
                  </td>
                  <td>{formatDateTime(beacon.last_seen)}</td>
                  <td>
                    <span className={`status ${getStatusClass(beacon.status)}`}>
                      {beacon.status}
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
    </div>
  );
}

export default App;
