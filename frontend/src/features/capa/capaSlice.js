import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchAllCapaActions = createAsyncThunk(
  'capa/fetchAllCapaActions',
  async (filters, { rejectWithValue }) => {
    try {
      return await api.listCapaActions(filters);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const generateCapaThunk = createAsyncThunk(
  'capa/generateCapa',
  async (investigationId, { rejectWithValue }) => {
    try {
      return await api.generateCapa(investigationId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateCapaStatusThunk = createAsyncThunk(
  'capa/updateCapaStatus',
  async ({ actionId, updates }, { rejectWithValue }) => {
    try {
      return await api.updateCapaAction(actionId, updates);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createManualCapaThunk = createAsyncThunk(
  'capa/createManualCapa',
  async (data, { rejectWithValue }) => {
    try {
      return await api.createCapaAction(data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const capaSlice = createSlice({
  name: 'capa',
  initialState: {
    actions: [],
    allActions: [], // across all investigations for CAPA Actions page
    disclaimer: '',
    loading: false,
    generating: false,
    error: null,
    hasChanges: false,
  },
  reducers: {
    setInvestigationCapas: (state, action) => {
      state.actions = action.payload;
    },
    updateLocalCapa: (state, action) => {
      const { action_id, updates } = action.payload;
      const idx = state.actions.findIndex(
        (a) => a.action_id === action_id || a.id === action_id
      );
      if (idx !== -1) {
        state.actions[idx] = { ...state.actions[idx], ...updates };
        state.hasChanges = true;
      }
    },
    removeLocalCapa: (state, action) => {
      state.actions = state.actions.filter(
        (a) => a.action_id !== action.payload && a.id !== action.payload
      );
      state.hasChanges = true;
    },
    addLocalCapa: (state, action) => {
      state.actions.push(action.payload);
      state.hasChanges = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate CAPA
      .addCase(generateCapaThunk.pending, (state) => {
        state.generating = true;
        state.error = null;
      })
      .addCase(generateCapaThunk.fulfilled, (state, action) => {
        state.generating = false;
        const ca = (action.payload.corrective_actions || []).map((x) => ({
          ...x,
          action_type: 'Corrective',
        }));
        const pa = (action.payload.preventive_actions || []).map((x) => ({
          ...x,
          action_type: 'Preventive',
        }));
        const ev = (action.payload.effectiveness_checks || []).map((x) => ({
          ...x,
          action_type: 'Effectiveness Verification',
        }));
        state.actions = [...ca, ...pa, ...ev];
        state.disclaimer = action.payload.disclaimer || '';
        state.hasChanges = true;
      })
      .addCase(generateCapaThunk.rejected, (state, action) => {
        state.generating = false;
        state.error = action.payload;
      })
      // Fetch all CAPA actions
      .addCase(fetchAllCapaActions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCapaActions.fulfilled, (state, action) => {
        state.loading = false;
        state.allActions = action.payload;
      })
      .addCase(fetchAllCapaActions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update action status
      .addCase(updateCapaStatusThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.actions.findIndex(
          (a) => a.id === updated.id || a.action_id === updated.action_id
        );
        if (idx !== -1) {
          state.actions[idx] = updated;
        }
        const allIdx = state.allActions.findIndex(
          (a) => a.id === updated.id || a.action_id === updated.action_id
        );
        if (allIdx !== -1) {
          state.allActions[allIdx] = updated;
        }
      });
  },
});

export const {
  setInvestigationCapas,
  updateLocalCapa,
  removeLocalCapa,
  addLocalCapa,
} = capaSlice.actions;

export default capaSlice.reducer;
