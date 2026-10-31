const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const api = {
  // Health
  getHealth: async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  // Dashboard Summary
  getDashboardSummary: async () => {
    const res = await fetch(`${BASE_URL}/api/investigations/summary`);
    if (!res.ok) throw new Error('Failed to fetch dashboard summary');
    return res.json();
  },

  // Investigations
  listInvestigations: async ({ search = '', status = '', severity = '' } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'All') params.append('status', status);
    if (severity && severity !== 'All') params.append('severity', severity);
    const res = await fetch(`${BASE_URL}/api/investigations?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch investigations');
    return res.json();
  },

  getInvestigation: async (id) => {
    const res = await fetch(`${BASE_URL}/api/investigations/${id}`);
    if (!res.ok) throw new Error(`Investigation ${id} not found`);
    return res.json();
  },

  createInvestigation: async (data) => {
    const res = await fetch(`${BASE_URL}/api/investigations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create investigation');
    }
    return res.json();
  },

  updateInvestigation: async (id, data) => {
    const res = await fetch(`${BASE_URL}/api/investigations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update investigation');
    }
    return res.json();
  },

  deleteInvestigation: async (id) => {
    const res = await fetch(`${BASE_URL}/api/investigations/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete investigation');
    return true;
  },

  saveReviewDecision: async (id, data) => {
    const res = await fetch(`${BASE_URL}/api/investigations/${id}/save-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save reviewer decision');
    }
    return res.json();
  },

  approveInvestigation: async (id, data) => {
    const res = await fetch(`${BASE_URL}/api/investigations/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to approve investigation');
    }
    return res.json();
  },

  // Evidence Gaps
  addEvidenceGap: async (investigationId, data) => {
    const res = await fetch(`${BASE_URL}/api/investigations/${investigationId}/evidence-gaps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add evidence gap');
    return res.json();
  },

  updateEvidenceGap: async (investigationId, gapId, data) => {
    const res = await fetch(`${BASE_URL}/api/investigations/${investigationId}/evidence-gaps/${gapId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update evidence gap');
    return res.json();
  },

  // AI Extraction & Graphs
  extractFromText: async (text, sourceType = 'pasted_text', investigationId = null) => {
    const res = await fetch(`${BASE_URL}/api/ai/extract-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source_type: sourceType, investigation_id: investigationId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'AI extraction failed');
    }
    return res.json();
  },

  extractFromEmail: async (emailData) => {
    const res = await fetch(`${BASE_URL}/api/ai/extract-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'AI email extraction failed');
    }
    return res.json();
  },

  uploadPdf: async (formData) => {
    const res = await fetch(`${BASE_URL}/api/ai/upload-pdf`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'PDF processing failed');
    }
    return res.json();
  },

  analyzeRca: async (investigationId) => {
    const res = await fetch(`${BASE_URL}/api/ai/investigations/${investigationId}/analyze-rca`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'RCA generation failed');
    }
    return res.json();
  },

  generateCapa: async (investigationId) => {
    const res = await fetch(`${BASE_URL}/api/ai/investigations/${investigationId}/generate-capa`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'CAPA generation failed');
    }
    return res.json();
  },

  // CAPA Actions
  listCapaActions: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.append('status', params.status);
    if (params.actionType) q.append('action_type', params.actionType);
    if (params.priority) q.append('priority', params.priority);
    if (params.investigationId) q.append('investigation_id', params.investigationId);
    const res = await fetch(`${BASE_URL}/api/capa-actions?${q.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch CAPA actions');
    return res.json();
  },

  createCapaAction: async (data) => {
    const res = await fetch(`${BASE_URL}/api/capa-actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create CAPA action');
    return res.json();
  },

  updateCapaAction: async (actionId, data) => {
    const res = await fetch(`${BASE_URL}/api/capa-actions/${actionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update CAPA action');
    return res.json();
  },

  deleteCapaAction: async (actionId) => {
    const res = await fetch(`${BASE_URL}/api/capa-actions/${actionId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete CAPA action');
    return true;
  }
};
