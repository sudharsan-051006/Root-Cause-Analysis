import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchDashboardSummary = createAsyncThunk(
  'investigation/fetchDashboardSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getDashboardSummary();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchInvestigations = createAsyncThunk(
  'investigation/fetchInvestigations',
  async (filters, { rejectWithValue }) => {
    try {
      return await api.listInvestigations(filters);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchInvestigationById = createAsyncThunk(
  'investigation/fetchInvestigationById',
  async (id, { rejectWithValue }) => {
    try {
      return await api.getInvestigation(id);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createNewInvestigation = createAsyncThunk(
  'investigation/createNewInvestigation',
  async (data, { rejectWithValue }) => {
    try {
      return await api.createInvestigation(data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const saveInvestigationChanges = createAsyncThunk(
  'investigation/saveInvestigationChanges',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await api.updateInvestigation(id, data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const saveReviewDecisionThunk = createAsyncThunk(
  'investigation/saveReviewDecision',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await api.saveReviewDecision(id, data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const approveInvestigationThunk = createAsyncThunk(
  'investigation/approveInvestigation',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await api.approveInvestigation(id, data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialInvestigationState = {
  id: null,
  title: 'Untitled Investigation',
  incident_date: '',
  api_product: '',
  batch_number: '',
  process_step: '',
  facility: '',
  equipment_id: '',
  owner: 'QA Investigations Lead',
  severity: 'Undetermined',
  status: 'Draft',
  problem_statement: '',
  what_happened: '',
  expected_condition: '',
  observed_condition: '',
  product_process_impact: '',
  immediate_containment: [],
  detection_method: '',
  relevant_parameters: [],
  supporting_observations: '',
  potential_quality_impact: '',
  potential_batch_impact: '',
  potential_patient_impact: '',
  initial_risk_assessment: '',
  is_approved: false,
  approved_at: null,
  approved_by: null,
  approval_notes: '',
  reviewer_decision: '',
  reviewer_notes: '',
  field_provenance: {},
  source_documents: [],
  evidence_gaps: [],
  root_causes: [],
  five_whys: null,
  capa_actions: [],
};

const investigationSlice = createSlice({
  name: 'investigation',
  initialState: {
    current: initialInvestigationState,
    list: [],
    summary: {
      total_investigations: 0,
      in_progress_count: 0,
      awaiting_review_count: 0,
      approved_count: 0,
      open_capa_count: 0,
    },
    loading: false,
    saving: false,
    error: null,
    saveSuccess: false,
    hasUnsavedChanges: false,
  },
  reducers: {
    resetCurrentInvestigation: (state) => {
      state.current = { ...initialInvestigationState };
      state.hasUnsavedChanges = false;
      state.saveSuccess = false;
      state.error = null;
    },
    updateFormField: (state, action) => {
      const { field, value, origin = 'entered_by_user' } = action.payload;
      state.current[field] = value;
      state.current.field_provenance = {
        ...(state.current.field_provenance || {}),
        [field]: {
          value,
          origin,
          evidence_quote: null,
        },
      };
      state.hasUnsavedChanges = true;
      state.saveSuccess = false;
    },
    populateFromAiExtraction: (state, action) => {
      const extracted = action.payload;
      // Do not overwrite user-edited fields if user has already made modifications
      Object.entries(extracted).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') {
          // If array, combine or set
          if (Array.isArray(val) && val.length > 0) {
            state.current[key] = val;
          } else if (!Array.isArray(val)) {
            state.current[key] = val;
          }
        }
      });
      if (extracted.field_provenance) {
        state.current.field_provenance = {
          ...(state.current.field_provenance || {}),
          ...extracted.field_provenance,
        };
      }
      if (extracted.missing_information && extracted.missing_information.length > 0) {
        state.current.evidence_gaps = extracted.missing_information;
      }
      state.hasUnsavedChanges = true;
    },
    updateEvidenceGapStatus: (state, action) => {
      const { gapId, status, reviewer_notes } = action.payload;
      const gap = state.current.evidence_gaps.find((g) => g.id === gapId);
      if (gap) {
        gap.status = status;
        if (reviewer_notes !== undefined) gap.reviewer_notes = reviewer_notes;
        state.hasUnsavedChanges = true;
      }
    },
    clearSaveNotification: (state) => {
      state.saveSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard Summary
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      })
      // List
      .addCase(fetchInvestigations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvestigations.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchInvestigations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Detail
      .addCase(fetchInvestigationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvestigationById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
        state.hasUnsavedChanges = false;
      })
      .addCase(fetchInvestigationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createNewInvestigation.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createNewInvestigation.fulfilled, (state, action) => {
        state.saving = false;
        state.current = action.payload;
        state.hasUnsavedChanges = false;
        state.saveSuccess = true;
      })
      .addCase(createNewInvestigation.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      // Save changes
      .addCase(saveInvestigationChanges.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveInvestigationChanges.fulfilled, (state, action) => {
        state.saving = false;
        state.current = action.payload;
        state.hasUnsavedChanges = false;
        state.saveSuccess = true;
      })
      .addCase(saveInvestigationChanges.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      // Review
      .addCase(saveReviewDecisionThunk.fulfilled, (state, action) => {
        state.current = action.payload;
        state.saveSuccess = true;
      })
      // Approve
      .addCase(approveInvestigationThunk.fulfilled, (state, action) => {
        state.current = action.payload;
        state.saveSuccess = true;
      });
  },
});

export const {
  resetCurrentInvestigation,
  updateFormField,
  populateFromAiExtraction,
  updateEvidenceGapStatus,
  clearSaveNotification,
} = investigationSlice.actions;

export default investigationSlice.reducer;
