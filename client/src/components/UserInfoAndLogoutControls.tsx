import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from '../store/reduxHooks';
import { useUserLogoutMutation } from '../features/api/apiSlice'
import { selectCurrentUser } from '../features/authSlice';
import { dispatchLogoutActions } from '../features/authSlice';
import { SquareButton } from './ui_elements/SquareButton';

/**
 * Displays logged in user name, surname, logout button, loading progress or error when loggint out; when user clicks "Logout" button, sends
 * logout request to backend, if response is successfull then triggers action to perform state change in Redux store to reflect logged out
 * user state.
 */
export function UserInfoAndLogoutControls(){
  //state variable that has same value as {isLoading} variable returned by logout endpoint but with some delay to display a "Please wait.."
  //loading indicator under button with some delay but not immediatelly after user clicks "Logout" button.
  //The {isLoading} variable becomes true as soon as user clicks "Logout" and if network is fast the "Please wait.." indicator appears very
  //shortly and page is redirected to login form. That looks bad, therefore loading indicator appears only if network response is longer
  //than 500 miliseconds. Meanwhile "Logout" button changes the background immediatelly after user clicks "Logout" button and endpoint 
  //starts loading serving as loading instant indicator
  const [isUserLoggingOut, setIsUserLoggingOut] = useState(false);

  const dispatch = useAppDispatch();

  const [triggerUserLogoutMutation, {
    error: userLogoutError,
    isLoading}] = useUserLogoutMutation()

  
  //reflects value of {isLoading} variable returned by logout endpoint - see comments on isUserLoggingOut state variable
  useEffect(() => {
    if(isLoading === true){
      //as soon a  
      let timer = setTimeout(() => {
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
      //endpoint completed successfully, remove user info from state, reset whole Redux state to initial state
      dispatchLogoutActions(dispatch)
    } catch (error) {
      //not processing error here, it is assigned to variable in userLogout mutation hook returned object
    }
      
  }

  const currentUser = useAppSelector(selectCurrentUser);

  //component should not be added to layout when user not logged in; adding check and step out if user not logged in
  if(!currentUser){
    return null;
  }

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
          {currentUser.name}
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
