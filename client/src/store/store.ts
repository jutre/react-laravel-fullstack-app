import { configureStore } from '@reduxjs/toolkit'
import booksReducer from '../features/booksSlice';
import authReducer from '../features/authSlice';
import { apiSlice } from '../features/api/apiSlice'


import { unauthenticatedResponseListener } from '../features/authSlice';

const store = configureStore({
    reducer: {
        authState: authReducer,
        booksState: booksReducer,
        [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware).concat(unauthenticatedResponseListener),
    //preloadedState
});

// Infer the type of `store`
export type AppStore = typeof store
// Infer the `AppDispatch` type from the store itself
export type AppDispatch = typeof store.dispatch
// Infer the `AppState` type
export type RootState = ReturnType<typeof store.getState>;

export default store;