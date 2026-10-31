import { configureStore } from '@reduxjs/toolkit';
import investigationReducer from '../features/investigation/investigationSlice';
import aiReducer from '../features/ai-assistant/aiSlice';
import rootCauseReducer from '../features/root-cause/rootCauseSlice';
import capaReducer from '../features/capa/capaSlice';

export const store = configureStore({
  reducer: {
    investigation: investigationReducer,
    ai: aiReducer,
    rootCause: rootCauseReducer,
    capa: capaReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});
