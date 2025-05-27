import { configureStore,
    combineReducers,
    UnknownAction } from '@reduxjs/toolkit'
import booksReducer from '../features/booksSlice';
import authReducer, { userLoggedOut, unauthenticatedResponseListener } from '../features/authSlice';
import { apiSlice } from '../features/api/apiSlice'



const combinedReducer = combineReducers({
        authState: authReducer,
        booksState: booksReducer,
        [apiSlice.reducerPath]: apiSlice.reducer,
})

//creating reducer that resets whole state to initial when 'userLoggedOut' action is dispatched to clear all user's data from Redux state.
//This is done to to prevent any user's data leaks (f.e, if browser has ReduxDevTools installed)
const rootReducer = (state: ReturnType<typeof combinedReducer> | undefined , action: UnknownAction) => {
    if (userLoggedOut.match(action)) {
        return combinedReducer(undefined, action);
    }
    return combinedReducer(state, action);
};

const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware).concat(unauthenticatedResponseListener),
});

// Infer the type of `store`
export type AppStore = typeof store
// Infer the `AppDispatch` type from the store itself
export type AppDispatch = typeof store.dispatch
// Infer the `AppState` type
export type RootState = ReturnType<typeof store.getState>;

export default store;