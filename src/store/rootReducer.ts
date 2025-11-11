// src/store/rootReducer.ts

import { combineReducers } from '@reduxjs/toolkit';
import spellingReducer from '@/features/spelling/spellingSlice';

const rootReducer = combineReducers({
  spelling: spellingReducer,
});

export default rootReducer;
