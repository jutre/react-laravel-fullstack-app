import { apiSlice, selectIsUserLoggenIn } from "./api/apiSlice";
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError , createAsyncThunk, isRejectedWithValue, Middleware, MiddlewareAPI  } from '@reduxjs/toolkit';

import { UserCredentials } from '../types/User';
import { AppDispatch, RootState } from "../store/store";
import { createAppSlice } from '../store/createAppSlice'
import { extractMessageFromQueryErrorObj } from "../utils/utils";
import { STATUS_IDLE,
  STATUS_PENDING,
  STATUS_REJECTED } from '../constants/asyncThunkExecutionStatus.ts';

interface AuthState { 
  sendingLoginCredentialsStatus: "idle" | "pending" | "rejected",
  sendingLoginCredentialsError?: string,
}

const initialState: AuthState = {
  sendingLoginCredentialsStatus: STATUS_IDLE,
  sendingLoginCredentialsError: undefined
};

/**
 * Performs login to Laravel backend.
 * It is required to first make a request to get CSRF cookie and because second request that sends username/password needs that cookie.
 * Doing that purely in RTK Query api slice was not successfull - when second endpoint was invoked in first endpoint's onQueryStarted
 * method the obtained cookie was not sent to backend.
 */
export const initiateSessionSendLoginCredentials = createAsyncThunk(
  'auth/sendLoginRequest',
  async (loginCredentils: UserCredentials, thunkApi) => {
    try {
        //disabled cache for possible subsequent logins after unsuccessful ones
        await thunkApi.dispatch(apiSlice.endpoints.getCsrfCookie.initiate(undefined, { forceRefetch: true })).unwrap()

        //in case of correct username/password the 'sendLoginCredentials' endpoint will set received user data to 'getCurrentLoggedInUser'
        //endpoint's cache
        const loggedInUserData = await thunkApi.dispatch(apiSlice.endpoints.sendLoginCredentials.initiate(loginCredentils)).unwrap()

        return loggedInUserData;

      } catch (error) {
        //if any of previous request fails, reject current thunk 
        return thunkApi.rejectWithValue(error)
      }
  })


/**
 * Thunk function that is to be dispatched from one of topmost components of UI layer - "App".
 * 
 * It is possibile that session is still valid (cookie present) and user data will be returned from server.
 * 
 */
export const initiateUserFetchingOnAppStart = () => (dispatch: AppDispatch) => {
    dispatch(apiSlice.endpoints.getCurrentLoggedInUser.initiate())
}


const authSlice = createAppSlice({
  name: 'auth',
  initialState,
  reducers: {
    // action to displatch when user logs out. Here reducer body is empty but in store.ts there is a global reducer that resets whole Redux
    // state to initial empty state in response to this action
    userLoggedOut(state){
    }
  },

  extraReducers: (builder) => {
    /**
     * tracking fetching statuses and returned data from async thunk which sends username and password
     */
    builder.addCase(initiateSessionSendLoginCredentials.pending, (state) => {
      state.sendingLoginCredentialsStatus = STATUS_PENDING
      //reset error from previous request if any
      state.sendingLoginCredentialsError = undefined
    })
    //on success action contains User object, set it to state and authentication status becomes 'loggen in'
    .addCase(initiateSessionSendLoginCredentials.fulfilled, (state, action) => {
      state.sendingLoginCredentialsStatus = STATUS_IDLE
    })
    .addCase(initiateSessionSendLoginCredentials.rejected, (state, action) => {
      state.sendingLoginCredentialsStatus = STATUS_REJECTED
      //initiateSessionSendLoginCredentials thunk dispathes rejected action in case of error response from login endpoint
      //the action payload is the error object a query endpoint returned
      state.sendingLoginCredentialsError = extractMessageFromQueryErrorObj(<FetchBaseQueryError|SerializedError>action.payload)
    })

  }
});

export const { userLoggedOut } = authSlice.actions

export default authSlice.reducer


export const selectSendLoginRequestStatus = (state: RootState) => state.authState.sendingLoginCredentialsStatus;

export const selectSendLoginRequestError = (state: RootState) => state.authState.sendingLoginCredentialsError;


/**
 * Redux middleware that tracks for "HTTP 401 unauthorized" or "419 unknown status" response code for RTK query api slices endpoint requests
 * and removes all user related data (Redux state data and cache from RTK query api slice) on such responses. Mentioned response codes 
 * indicate that user session on server has expired, user is logged out, logged out state should be forced also on fronted. 
 * When session on Laravel backend expires, it sends "HTTP 401 unauthorized" code in response to reading HTTP methods (GET) and "419 unknown
 * status" response code in response to modifying methods (POST, PUT, DELETE). 
 */
export const unauthenticatedResponseListener: Middleware = (api: MiddlewareAPI) => (next) => (action) => {
  
  //look for thunk action's 'status' property in case this is rejected action with value; value contain HTTP status code
  if (isRejectedWithValue(action) && typeof action.payload  === 'object' && action.payload !== null && 'status' in action.payload) {
    
    //HTTP status code resides in action's payload object's 'status' property
    const payloadStatus: unknown = action.payload.status
    
    if (payloadStatus === 401 || payloadStatus === 419) {
      //if user is logged in, dispatch action that will clear user data. 
      //Unauthenticated error will also be received when user is trying to log in and enters invalid credentials, but in such case there is
      //no user data yet, no user data to reset
      if(selectIsUserLoggenIn(api.getState())){
        api.dispatch(userLoggedOut());
      }
    }
  }

  return next(action);
}