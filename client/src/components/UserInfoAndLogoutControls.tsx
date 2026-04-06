import { useState, useEffect } from "react";
import { useAppDispatch } from '../store/reduxHooks';
import { useUserLogoutMutation } from '../features/api/apiSlice'
import { userLoggedOut } from '../features/authSlice';
import { apiSlice } from "../features/api/apiSlice";
import { useNavigate } from 'react-router-dom';
import { routes } from '../config';
import { SquareButton } from './ui_elements/SquareButton';

/**
 * Displays logged in user name, surname, logout button, loading progress or error when loggint out; when user clicks "Logout" button, sends
 * logout request to backend, if response is successfull then triggers action to perform state change in Redux store to reflect logged out
 * user state.
 */
export function UserInfoAndLogoutControls(){

  //State variable to postpone displaying loading indicator text "please wait..." under "Logout" button by 500 miliseconds after user clicks
  //it. Variable receives value from { isLoading } variable returned by logout endpoint with delay. Without delay the "Please wait.."
  //indicator would appears shortly followed by page redirected to login form in case network is fast which looks bad.
  //Meanwhile "Logout" button grays out immediatelly after user clicks "Logout" button
  const [isUserLoggingOut, setIsUserLoggingOut] = useState(false);

  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const [triggerUserLogoutMutation, {
    error: userLogoutError,
    isLoading}] = useUserLogoutMutation()

  
  //set { isLoading } variable `true' value to isUserLoggingOut state variable with delay
  useEffect(() => {
    if(isLoading === true){
      const timer = setTimeout(() => {
        setIsUserLoggingOut(true);
      }, 500);

      return () => clearTimeout(timer);
    }else{
      setIsUserLoggingOut(false)
    }
  }, [isLoading]);

  /**
   * function invokes endpoint to log out current user
   */
  async function logoutBtnClickHandler(){
    try {
      await triggerUserLogoutMutation().unwrap();
      //endpoint completed successfully, remove user info and reset whole Redux state to initial state, redirect to home page
      dispatch(userLoggedOut())
      navigate(routes.bookListPath)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      //not processing error here, it is assigned to variable in userLogout mutation hook returned object
    }
      
  }

  const { data: currentUser } = apiSlice.endpoints.getCurrentLoggedInUser.useQueryState()

  //component should not be added to layout when user not logged in but according to type user may be undefined
  const userFullName = currentUser?.name ?? 'undefined'

  let errorMsg: string | undefined;
  if (userLogoutError) {
    //place a short error message under logout button instead of extracting long error message from response as lo
    errorMsg = 'An error occured'
  }

  //make button disabled as soon as logout endpoint starts loading, the background of button is changed to defined disabled style. But the
  //"Please wait.." label appears with a little delay - see comments on isUserLoggingOut state variable
  const isButtonDisabled = isLoading === true

  return (
    <div>
      <div className='flex items-center flex-wrap'>
        <div className="mr-[8px]">
          {userFullName}
        </div>
          {/* "Logout" button, has less top/botton padding then button's default padding */}
          <SquareButton buttonContent='Logout'
            clickHandler={logoutBtnClickHandler}
            disabled={isButtonDisabled}
            additionalTwcssClasses='py-[6px]'/>
      </div>

      {errorMsg &&
        <div className='absolute whitespace-nowrap right-0 mt-[5px] rounded-[8px] text-red-500 bg-white border border-red-500 p-[10px]'>
          {errorMsg}
        </div>}
      
      {isUserLoggingOut &&
        <div className='absolute whitespace-nowrap right-0 mt-[5px] rounded-[8px] bg-white border border-black-800 p-[10px]'>
          please wait...
        </div>}
    </div>
  )
}
