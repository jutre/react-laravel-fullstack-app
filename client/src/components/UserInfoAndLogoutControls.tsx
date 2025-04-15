/**
 * displays or hides data source settings menu. Menu can be closed by click on same element that opened 
 * the menu or on any element in page except menu itself
 */
import { useAppSelector, useAppDispatch } from '../store/reduxHooks';
import { useUserLogoutMutation } from '../features/api/apiSlice'
import { selectCurrentUser } from '../features/authSlice';
import { dispatchLogoutActions } from '../features/authSlice';
import { SquareButton } from './ui_elements/SquareButton';

export function UserInfoAndLogoutControls(){


  const dispatch = useAppDispatch();

  const [triggerUserLogoutMutation, {
    error: userLogoutError,
    isLoading: isUserLoggingout}] = useUserLogoutMutation()


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

  return (
    <div>
      <div className='flex items-center flex-wrap'>
        <div className="mr-[8px]">
          {currentUser.name}
        </div>
          {/* "Logout" button, has less top/botton padding then button's default padding */}
          <SquareButton buttonContent='Logout'
            clickHandler={logoutBtnClickHandler}
            additionalTwcssClasses='py-[6px]'/>
      </div>

      {errorMsg &&
        <div className='absolute whitespace-nowrap right-0 mt-[5px] rounded-[8px] text-red-500 bg-white border border-red-500 p-[10px]'>
          {errorMsg}
        </div>}
      
      {isUserLoggingout &&
        <div className='absolute whitespace-nowrap right-0 mt-[5px] rounded-[8px] bg-white border border-black-800 p-[10px]'>
          please wait..
        </div>}
    </div>
  )
}
