// src/App.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const SERVER_URL = "http://localhost:5000";

function App() {
  const [logs, setLogs] = useState([]);
  const [newLog, setNewLog] = useState("");
  const [serverName, setServerName] = useState("server-1");
  const [analytics, setAnalytics] = useState({});

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${SERVER_URL}/data`);
      setLogs(response.data);
      calculateAnalytics(response.data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
  };

  const calculateAnalytics = (data) => {
    const serverCounts = {};
    data.forEach((log) => {
      serverCounts[log.server] = (serverCounts[log.server] || 0) + 1;
    });
    setAnalytics(serverCounts);
  };

  const sendLog = async () => {
    if (!newLog) return;
    try {
      await axios.post(`${SERVER_URL}/ingest`, {
        content: newLog,
        server: serverName,
      });
      setNewLog("");
      fetchLogs();
    } catch (err) {
      console.error("Failed to send log", err);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>📊 Data Ingestion Dashboard</h1>

      <div style={{ marginBottom: 20 }}>
        <textarea
          rows={3}
          placeholder="Type log content..."
          value={newLog}
          onChange={(e) => setNewLog(e.target.value)}
          style={{ width: "100%", padding: 10 }}
        />
        <input
          type="text"
          value={serverName}
          onChange={(e) => setServerName(e.target.value)}
          placeholder="Server name"
          style={{ marginTop: 10, padding: 8 }}
        />
        <br />
        <button onClick={sendLog} style={{ marginTop: 10 }}>
          Send Log
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h2>📈 Analytics</h2>
        {Object.entries(analytics).map(([server, count]) => (
          <div key={server}>
            {server}: {count} logs
          </div>
        ))}
      </div>

      <div>
        <h2>📜 Recent Logs</h2>
        <ul>
          {logs.map((log) => (
            <li key={log._id}>
              <strong>{log.server}</strong> [{new Date(log.timestamp).toLocaleString()}]: {log.content}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;