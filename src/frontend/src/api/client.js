/**
 * NETRA API Client
 * Seamless communication with FastAPI backend endpoints with graceful fallback handling
 */

// API base: uses VITE_API_URL env in production, relative path in local dev (Vite proxy)
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';


async function fetchJSON(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

export const api = {
  // Health
  getHealth: () => fetchJSON('/health'),

  // Dashboard
  getDashboardStats: () => fetchJSON('/dashboard/stats'),

  // Devices
  getDevices: (vendor, criticality) => {
    const params = new URLSearchParams();
    if (vendor) params.append('vendor', vendor);
    if (criticality) params.append('criticality', criticality);
    return fetchJSON(`/devices?${params.toString()}`);
  },
  getDevice: (id) => fetchJSON(`/devices/${id}`),

  // Ingestion
  detectVendor: (configText) => {
    const formData = new FormData();
    formData.append('config_text', configText);
    return fetch(`${API_BASE}/ingestion/detect`, {
      method: 'POST',
      body: formData,
    }).then((res) => res.json());
  },
  uploadConfigFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/ingestion/upload`, {
      method: 'POST',
      body: formData,
    }).then((res) => res.json());
  },
  getSampleConfigs: () => fetchJSON('/ingestion/samples'),

  // Audit Execution
  executeAudit: (data) =>
    fetchJSON('/audit/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAudits: (deviceId) => {
    const params = deviceId ? `?device_id=${deviceId}` : '';
    return fetchJSON(`/audit${params}`);
  },
  getAuditDetails: (auditId) => fetchJSON(`/audit/${auditId}`),

  // Compliance
  getComplianceRules: (framework, severity) => {
    const params = new URLSearchParams();
    if (framework) params.append('framework', framework);
    if (severity) params.append('severity', severity);
    return fetchJSON(`/compliance/rules?${params.toString()}`);
  },
  getFrameworkStats: () => fetchJSON('/compliance/framework-stats'),

  // Findings
  getFindings: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.framework) params.append('framework', filters.framework);
    if (filters.device_id) params.append('device_id', filters.device_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    return fetchJSON(`/findings?${params.toString()}`);
  },
  getFinding: (id) => fetchJSON(`/findings/${id}`),
  updateFinding: (id, data) =>
    fetchJSON(`/findings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  explainFindingAI: (id) =>
    fetchJSON(`/findings/${id}/ai-explain`, { method: 'POST' }),

  // Security Graph
  getSecurityGraph: () => fetchJSON('/graph'),
  getAttackPaths: () => fetchJSON('/graph/attack-paths'),

  // Remediation
  getRemediations: (status) => {
    const params = status ? `?status=${status}` : '';
    return fetchJSON(`/remediation${params}`);
  },
  simulateRemediation: (id) =>
    fetchJSON(`/remediation/${id}/simulate`, { method: 'POST' }),
  validateRemediation: (id) =>
    fetchJSON(`/remediation/${id}/validate`, { method: 'POST' }),
  approveRemediation: (id, approver) => {
    const params = approver ? `?approver=${encodeURIComponent(approver)}` : '';
    return fetchJSON(`/remediation/${id}/approve${params}`, { method: 'POST' });
  },

  // Reports
  getReports: () => fetchJSON('/reports'),
  getReport: (id) => fetchJSON(`/reports/${id}`),
  generateReport: (title, reportType) =>
    fetchJSON('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ title, report_type: reportType }),
    }),

  // Drift
  getDriftEntries: (deviceId) => {
    const params = deviceId ? `?device_id=${deviceId}` : '';
    return fetchJSON(`/drift${params}`);
  },
  compareConfigs: (deviceId, baselineConfig, currentConfig) => {
    const formData = new FormData();
    formData.append('device_id', deviceId);
    formData.append('baseline_config', baselineConfig);
    formData.append('current_config', currentConfig);
    return fetch(`${API_BASE}/drift/compare`, {
      method: 'POST',
      body: formData,
    }).then((res) => res.json());
  },
};
