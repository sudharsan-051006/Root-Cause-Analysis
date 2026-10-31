import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import { populateFromAiExtraction } from '../investigation/investigationSlice';

export const extractFromTextThunk = createAsyncThunk(
  'ai/extractFromText',
  async ({ text, sourceType, investigationId }, { dispatch, rejectWithValue }) => {
    try {
      const result = await api.extractFromText(text, sourceType, investigationId);
      // Auto-populate form fields
      dispatch(populateFromAiExtraction(result));
      return result;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const extractFromEmailThunk = createAsyncThunk(
  'ai/extractFromEmail',
  async (emailData, { dispatch, rejectWithValue }) => {
    try {
      const result = await api.extractFromEmail(emailData);
      dispatch(populateFromAiExtraction(result));
      return result;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const uploadPdfThunk = createAsyncThunk(
  'ai/uploadPdf',
  async ({ file, investigationId }, { dispatch, rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('run_ai_analysis', 'true');
      if (investigationId) formData.append('investigation_id', investigationId);

      const response = await api.uploadPdf(formData);
      if (response.status === 'ocr_required') {
        return rejectWithValue(response.error);
      }
      if (response.structured_data) {
        dispatch(populateFromAiExtraction(response.structured_data));
      }
      return response;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const aiSlice = createSlice({
  name: 'ai',
  initialState: {
    inputMode: 'text', // 'pdf' | 'text' | 'email'
    processingStep: 'idle', // 'idle' | 'reading_source' | 'extracting_details' | 'identifying_evidence' | 'preparing_fields' | 'complete' | 'error'
    isProcessing: false,
    extractedData: null,
    sourcePreview: '',
    error: null,
    pdfMeta: null,
  },
  reducers: {
    setInputMode: (state, action) => {
      state.inputMode = action.payload;
      state.error = null;
    },
    setSourcePreview: (state, action) => {
      state.sourcePreview = action.payload;
    },
    resetAiState: (state) => {
      state.processingStep = 'idle';
      state.isProcessing = false;
      state.extractedData = null;
      state.error = null;
      state.pdfMeta = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Text Extraction
      .addCase(extractFromTextThunk.pending, (state) => {
        state.isProcessing = true;
        state.processingStep = 'extracting_details';
        state.error = null;
      })
      .addCase(extractFromTextThunk.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.processingStep = 'complete';
        state.extractedData = action.payload;
      })
      .addCase(extractFromTextThunk.rejected, (state, action) => {
        state.isProcessing = false;
        state.processingStep = 'error';
        state.error = action.payload;
      })
      // Email Extraction
      .addCase(extractFromEmailThunk.pending, (state) => {
        state.isProcessing = true;
        state.processingStep = 'extracting_details';
        state.error = null;
      })
      .addCase(extractFromEmailThunk.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.processingStep = 'complete';
        state.extractedData = action.payload;
      })
      .addCase(extractFromEmailThunk.rejected, (state, action) => {
        state.isProcessing = false;
        state.processingStep = 'error';
        state.error = action.payload;
      })
      // PDF Upload
      .addCase(uploadPdfThunk.pending, (state) => {
        state.isProcessing = true;
        state.processingStep = 'reading_source';
        state.error = null;
      })
      .addCase(uploadPdfThunk.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.processingStep = 'complete';
        state.sourcePreview = action.payload.extracted_text || '';
        state.pdfMeta = {
          filename: action.payload.filename,
          page_count: action.payload.page_count,
          char_count: action.payload.char_count,
        };
        if (action.payload.structured_data) {
          state.extractedData = action.payload.structured_data;
        }
      })
      .addCase(uploadPdfThunk.rejected, (state, action) => {
        state.isProcessing = false;
        state.processingStep = 'error';
        state.error = action.payload;
      });
  },
});

export const { setInputMode, setSourcePreview, resetAiState } = aiSlice.actions;
export default aiSlice.reducer;
