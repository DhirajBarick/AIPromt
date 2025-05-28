// src/App.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const SERVER_URL = "http://localhost:5000";

function App() {
  const [logs, setLogs] = useState([]);
  const [newLog, setNewLog] = useState("");
  const [serverName, setServerName] = useState("server-1");
  const [severity, setSeverity] = useState("INFO");
  const [analytics, setAnalytics] = useState({});
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
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
        severity,
      });
      setNewLog("");
      fetchLogs();
    } catch (err) {
      console.error("Failed to send log", err);
    }
  };

  const filteredLogs = filter === "all" ? logs : logs.filter(log => log.server === filter);

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
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          style={{ marginTop: 10, marginLeft: 10, padding: 8 }}
        >
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
        </select>
        <br />
        <button onClick={sendLog} style={{ marginTop: 10 }}>
          Send Log
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h2>📈 Analytics</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={Object.entries(analytics).map(([server, count]) => ({ server, count }))}
          >
            <XAxis dataKey="server" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>

        <label htmlFor="filter">Filter by Server: </label>
        <select
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ marginLeft: 10 }}
        >
          <option value="all">All</option>
          {Object.keys(analytics).map((server) => (
            <option key={server} value={server}>{server}</option>
          ))}
        </select>
      </div>

      <div>
        <h2>📜 Recent Logs</h2>
        <ul>
          {filteredLogs.map((log) => (
            <li key={log._id} style={{ color: log.severity === 'ERROR' ? 'red' : log.severity === 'WARN' ? 'orange' : 'black' }}>
              <strong>{log.server}</strong> [{new Date(log.timestamp).toLocaleString()}] [{log.severity}]: {log.content}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
