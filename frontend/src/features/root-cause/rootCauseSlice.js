import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const generateRcaThunk = createAsyncThunk(
  'rootCause/generateRca',
  async (investigationId, { rejectWithValue }) => {
    try {
      return await api.analyzeRca(investigationId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialFiveWhys = {
  problem_statement: '',
  why_1: '',
  why_2: '',
  why_3: '',
  why_4: '',
  why_5: '',
  proposed_root_cause: '',
  supporting_evidence: [],
  missing_evidence: [],
  reviewer_decision: 'Under Investigation',
  reviewer_notes: '',
};

const rootCauseSlice = createSlice({
  name: 'rootCause',
  initialState: {
    fiveWhys: initialFiveWhys,
    causes: [],
    investigationSummary: '',
    disclaimer: '',
    activeTab: '5whys', // '5whys' | 'fishbone' | 'causes_list'
    loading: false,
    error: null,
    hasChanges: false,
  },
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setFiveWhysData: (state, action) => {
      state.fiveWhys = { ...state.fiveWhys, ...action.payload };
    },
    updateFiveWhysField: (state, action) => {
      const { field, value } = action.payload;
      state.fiveWhys[field] = value;
      state.hasChanges = true;
    },
    setCausesData: (state, action) => {
      state.causes = action.payload;
    },
    addCauseItem: (state, action) => {
      state.causes.push(action.payload);
      state.hasChanges = true;
    },
    updateCauseItem: (state, action) => {
      const { cause_id, updates } = action.payload;
      const idx = state.causes.findIndex((c) => c.cause_id === cause_id);
      if (idx !== -1) {
        state.causes[idx] = { ...state.causes[idx], ...updates };
        state.hasChanges = true;
      }
    },
    removeCauseItem: (state, action) => {
      state.causes = state.causes.filter((c) => c.cause_id !== action.payload);
      state.hasChanges = true;
    },
    setCauseStatus: (state, action) => {
      const { cause_id, status, is_confirmed } = action.payload;
      const cause = state.causes.find((c) => c.cause_id === cause_id);
      if (cause) {
        cause.status = status;
        if (is_confirmed !== undefined) {
          cause.is_confirmed_root_cause = is_confirmed;
        }
        state.hasChanges = true;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateRcaThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateRcaThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.fiveWhys = action.payload.five_whys || initialFiveWhys;
        state.causes = action.payload.causes || [];
        state.investigationSummary = action.payload.investigation_summary || '';
        state.disclaimer = action.payload.disclaimer || '';
        state.hasChanges = true;
      })
      .addCase(generateRcaThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setActiveTab,
  setFiveWhysData,
  updateFiveWhysField,
  setCausesData,
  addCauseItem,
  updateCauseItem,
  removeCauseItem,
  setCauseStatus,
} = rootCauseSlice.actions;

export default rootCauseSlice.reducer;
