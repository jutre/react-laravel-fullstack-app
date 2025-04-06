import { apiSlice } from "./api/apiSlice";
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';

import { User, UserCredentials } from '../types/User';
import { AppDispatch, RootState } from "../store/store";
import { createAppSlice } from '../store/createAppSlice'
import { createAsyncThunk, isRejectedWithValue, Middleware, MiddlewareAPI  } from '@reduxjs/toolkit';
import { extractMessageFromQueryErrorObj } from "../utils/utils";
export const STATUS_PENDING = "pending";
export const STATUS_IDLE = "idle";
export const STATUS_REJECTED = "rejected"

interface AuthState { 
  //when user is logged out, user is undefined
  user?: User,

  //fetching user on app start is done to find out if actual session exists and get user data if session exists.
  //While user data is being fetched, it is not known yet whether user's data will be present or user session
  //expired and login form must be displayed, instead of mentioned a "loading" indicator will be displayed
  //while request quering current session's data is pending
  userFetchingStatus: "idle" | "pending",

  sendingLoginCredentialsStatus: "idle" | "pending" | "rejected",
  sendingLoginCredentialsError?: string,
}

let initialState: AuthState = {
  user: undefined,
  userFetchingStatus: STATUS_IDLE,
  sendingLoginCredentialsStatus: STATUS_IDLE,
  sendingLoginCredentialsError: undefined
};


export const initiateSessionSendLoginCredentials = createAsyncThunk(
  'auth/sendLoginRequest',
  async (loginCredentils: UserCredentials, thunkApi) => {
    try {
        //disabled cache forcing making request to server in case user tries to login again after possible previous unsuccessful login
        await thunkApi.dispatch(apiSlice.endpoints.getCsrfCookie.initiate(undefined, { forceRefetch: true })).unwrap()
        //after previous request succeeds, the CSRF cookie is obtained for sending with login credentials
        let loggedInUserData = await thunkApi.dispatch(apiSlice.endpoints.sendLoginCredentials.initiate(loginCredentils)).unwrap()
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

/**
 * function that dispatches two Redux actions: 'userLogged' action and 'resetApiState'. Action userLogged causes setting authState.user
 * field to 'undefined', resets whole Redux state to initial and 'resetApiState' resets state in api slice.
 * Whole Redux state and api slice cache must be removed to prevent any possibility to access
 * previously loggen in user's data - first obvious way to access the cache would be Redux devtools extension if installed.
 * Function invoked in two places: when Redux store middleware function encounters error with HTTP "401 Unauthorized" status 
 * produced by RTKQuery api clice and when user performs "logout" action in user interface
 * 
 */
export const dispatchLogoutActions = (dispatch: AppDispatch) => {
  dispatch(userLoggedOut());
  dispatch(apiSlice.util.resetApiState());
}

const authSlice = createAppSlice({
  name: 'auth',
  initialState,
  reducers: {
    //on user logout clear logged in user data;
    //also there is a reducer that resets whole Redux state to initial in store definition file store.ts when 'userLoggetOut' action is
    //dispatched
    userLoggedOut(state){
      state.user = undefined;
    }
  },

  extraReducers: (builder) => {

    builder.addCase(initiateSessionSendLoginCredentials.pending, (state) => {
      state.sendingLoginCredentialsStatus = STATUS_PENDING
      //reset error from previous request if any
      state.sendingLoginCredentialsError = undefined
    })
    //on success action contains User object, set it to state and authentication status becomes 'loggen in'
    .addCase(initiateSessionSendLoginCredentials.fulfilled, (state, action) => {
      state.sendingLoginCredentialsStatus = STATUS_IDLE
      state.user = action.payload
      state.userFetchingStatus = STATUS_IDLE
    })
    .addCase(initiateSessionSendLoginCredentials.rejected, (state, action) => {
      state.sendingLoginCredentialsStatus = STATUS_REJECTED
      //initiateSessionSendLoginCredentials thunk dispathes rejected action in case of error response from login endpoint
      //the action payload is the error object a query endpoint returned
      state.sendingLoginCredentialsError = extractMessageFromQueryErrorObj(<FetchBaseQueryError|SerializedError>action.payload)
    })

    /**
     * tracking fetching statuses and returned data from api endpoint which fetches currently logged in user 
     */
    //in case of "fulfilled" status also set user data that was fetched by query
    .addMatcher(
      apiSlice.endpoints.getCurrentLoggedInUser.matchFulfilled,
      (state, action) => {
        state.user = action.payload
        state.userFetchingStatus = "idle"
      }
    ) 
    .addMatcher(
      apiSlice.endpoints.getCurrentLoggedInUser.matchPending,
      (state) => {
        state.userFetchingStatus = STATUS_PENDING
      }
    )
    .addMatcher(
      apiSlice.endpoints.getCurrentLoggedInUser.matchRejected,
      (state) => {
        //fetching user on app start it is done to find out if actual session exists and get user data if session exists.
        //In case of fetch rejecting not caring about rejection error, typically "401 unauthenticated error" if session ended or other 
        //reason like HTTP 503 response. If user data is not received in response always login form will be shown, therefore set status 
        //to "idle"
        state.userFetchingStatus = STATUS_IDLE
      }
    )

  }
});

export const { userLoggedOut } = authSlice.actions

export default authSlice.reducer

/**
 * returns true if user is logget it, that is a field value is set to other value than `undefined`; because of field's type
 * if it is not `undefined`, the value is user object.
 * @param state 
 * @returns boolean - true if user is logged in 
 */
export const  selectIsUserLoggenIn = (state: RootState) => state.authState.user !== undefined;

export const  selectCurrentUser = (state: RootState) => state.authState.user;

export const selectUserLoadingStatus = (state: RootState) => state.authState.userFetchingStatus;

export const selectSendLoginRequestStatus = (state: RootState) => state.authState.sendingLoginCredentialsStatus;

export const selectSendLoginRequestError = (state: RootState) => state.authState.sendingLoginCredentialsError;


/**
 * Redux middleware that tracks for "HTTP 401 unauthorized" or "419 unknown status" response code for RTK query api slices endpoint requests
 * and removes all user related data (Redux state data and cache from RTK query api slice) on such responses. Mentioned response codes 
 * indicate that user session on server has expired, user is logged out, logged out state should be forced also on fronted. 
 * When session on Laravel backend expires, it sends "HTTP 401 unauthorized" code in response to reading HTTP methods (GET) and "419 unknown
 * status" response code in response to modifying methods (POST, PUT, DELETE). 
 */
export const unauthenticatedResponseListener: Middleware = (api: MiddlewareAPI) => (next) => (action: any) => {
  
  if (isRejectedWithValue(action)) {
    //HTTP status code resides in action's payload object's 'status' property,
    let payloadStatus: any = action?.payload?.status
    
    if (payloadStatus === 401 || payloadStatus === 419) {
      //if user is logged in, dispatch action that will clear user data. 
      //Unauthenticated error will also be received when user is trying to log in and enters invalid credentials, but in such case there is
      //no user data yet, no user data to reset
      if(selectIsUserLoggenIn(api.getState())){
        dispatchLogoutActions(api.dispatch);
      }
    }
  }

  return next(action);
}