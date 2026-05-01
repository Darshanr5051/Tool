const fs = require('fs');
const path = require('path');

const logsFile = path.join(__dirname, '..', 'data', 'logs.json');

const getLogs = () => {
  if (!fs.existsSync(logsFile)) {
    return [];
  }
  const data = fs.readFileSync(logsFile, 'utf8');
  return JSON.parse(data);
};

const saveLogs = (logs) => {
  fs.writeFileSync(logsFile, JSON.stringify(logs, null, 2));
};

const addLog = (user, action, details) => {
  const logs = getLogs();
  const newLog = {
    id: logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1,
    user: user ? (user.username || 'System') : 'System',
    action,
    details,
    timestamp: new Date().toISOString()
  };
  logs.unshift(newLog); // Add to beginning
  // Keep only the last 1000 logs
  if (logs.length > 1000) {
    logs.length = 1000;
  }
  saveLogs(logs);
};

module.exports = {
  getLogs,
  addLog
};
