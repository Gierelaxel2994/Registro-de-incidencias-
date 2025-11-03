interface LogEntry {
  timestamp: string;
  action: string;
}

const LOG_KEY = 'activityLog';

/**
 * Retrieves all log entries from localStorage.
 * @returns {LogEntry[]} An array of log entries.
 */
export const getLogs = (): LogEntry[] => {
  try {
    const savedLogs = localStorage.getItem(LOG_KEY);
    return savedLogs ? JSON.parse(savedLogs) : [];
  } catch (error) {
    console.error("Error reading activity log from localStorage:", error);
    return [];
  }
};

/**
 * Adds a new action to the activity log.
 * @param {string} action - A description of the action performed.
 */
export const logAction = (action: string): void => {
  try {
    const timestamp = new Date().toISOString();
    const newLog: LogEntry = { timestamp, action };
    const logs = getLogs();
    // Keep the log to a reasonable size to avoid storage issues
    if (logs.length > 5000) {
      logs.shift(); 
    }
    logs.push(newLog);
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Error saving activity log to localStorage:", error);
  }
};

/**
 * Exports the activity log as a downloadable CSV file.
 * @returns {boolean} - True if logs were exported, false if no logs were found.
 */
export const exportLogs = (): boolean => {
  const logs = getLogs();
  if (logs.length === 0) {
    return false;
  }

  const header = 'Timestamp,Action\n';
  const csvContent = logs.map(log => {
    const escapedTimestamp = `"${log.timestamp.replace(/"/g, '""')}"`;
    const escapedAction = `"${log.action.replace(/"/g, '""')}"`;
    return `${escapedTimestamp},${escapedAction}`;
  }).join('\n');

  const fullCsv = header + csvContent;
  const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
  
  const now = new Date();
  const timestamp = now.toISOString().split('T')[0];
  const filename = `log_de_actividad_${timestamp}.csv`;

  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  return true;
};
