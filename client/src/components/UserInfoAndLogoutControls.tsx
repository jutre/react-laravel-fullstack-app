/**
 * displays or hides data source settings menu. Menu can be closed by click on same element that opened 
 * the menu or on any element in page except menu itself
 */
import {useState, useRef, useCallback} from 'react';
import { closeDivOnClickOutsideOfDiv } from '../utils/utils';
import { ButtonWithIcon } from './ui_elements/ButtonWithIcon';
import { useAppSelector, useAppDispatch } from '../store/reduxHooks';
import { useUserLogoutMutation } from '../features/api/apiSlice'
import { selectCurrentUser } from '../features/authSlice';
import { dispatchLogoutActions } from '../features/authSlice';

export function UserInfoAndLogoutControls(){
  //actually settings form could be shown/hidden by outputting or not  outputting form component depending
  //on hidden or shown status because not planning to use any css transitions while showing/hiding but
  //in such case form is completely mounted/unmounted and previously selected selected radio button selection
  //state (React.useState) is completely lost and using React state requires less code than it would if storing 
  //such state in Redux
  const [isMenuOpened, setIsMenuOpened] = useState(false);

  //for closing popup div by click on any element in document except menu itself 
  //we need to track the beginning of menu element
  const beginningOfMenuRef = useRef(null);

  //ref to window.document for adding click event listener when menu is opened and 
  //removing it when menu is closed (for performance issues don't use directly
  //document.addEventListener()/removeEventListener())
  const documentRef = useRef(document);

  const dispatch = useAppDispatch();

  const [triggerUserLogoutMutation, {
    error: userLogoutError,
    isLoading: isUserLoggingout,
    reset}] = useUserLogoutMutation()

  /**
   * hides a displayed 'logout' button when clicking anywhere in document except a 'logout' button itself and an icon that snows/hides
   * 'logout' button, also reset endpoint that sends logout request to hide possible error message from previous unsuccessful logout
   * 
   * Event listerner function is created using useCallback() hook. This is done to be able to remove
   * previously attached event handler when needeed as on each render of React component a defined  
   * function inside component, which is defined withous using useCallback() hook, is created as 
   * new function and such function won't be removed by a document.removeEventListener() call. 
   * Using useCallback() creates memorized function which can be later removed by removeEventListener() method.
   * @param {*} event 
   * @returns 
   */
  const hideDivOnClickOutsideOfDiv = useCallback((event: MouseEvent)=>{
    
    //to close info div, we need to set state in component to false. Event attribute is not used
    const closeMenuAction = () =>{
      setIsMenuOpened(false)
      reset()
    };

    closeDivOnClickOutsideOfDiv(event, beginningOfMenuRef, documentRef, hideDivOnClickOutsideOfDiv, closeMenuAction)
  }, [])

  /**
   * toggles menu state variable to opposite; adds event handler to window.document 
   * when the menu must be displayed, removes that handler when menu is to be hidden, also resets endpoint that sends logout request to hide
   * possible error message from previous unsuccessful logout
   * 
   */
  function handleMenuToggle(){
    if(!isMenuOpened){
      setIsMenuOpened(true);
      documentRef.current.addEventListener('click', hideDivOnClickOutsideOfDiv);
    }else{
      setIsMenuOpened(false);
      documentRef.current.removeEventListener('click', hideDivOnClickOutsideOfDiv);
      reset()
    }
  }

  /**
   * function invokes endpoint to log out current user
   */
  async function logoutBtnClickHandler(){
    try {
      await triggerUserLogoutMutation().unwrap();
      //endpoint completed successfully, remove user info from state, reset whole Redux state to initial state
      dispatchLogoutActions(dispatch)
      //click handler closing 'logout' button is not needed any more
      documentRef.current.removeEventListener('click', hideDivOnClickOutsideOfDiv);
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
    <div ref={beginningOfMenuRef}>
      <div className=' flex items-center flex-wrap'>
        {/* adjust line height to be same as icon height to center text and icon vertically */}
        <div className="mr-[8px] leading-[22px] ">
          {currentUser.name}
        </div>
        {/*button as icon toggling logout button visibility*/}
        <ButtonWithIcon
          clickHandler={handleMenuToggle}
          beforeElemMaskImgUrlTwCssClass="before:[mask-image:url(assets/settings.svg)]"
          beforeElemMaskSizeTwCssClass="before:[mask-size:22px]"
          beforeElemBackgndColorTwCssClass="before:bg-[#555]"
          otherClasses="relative h-[22px] w-[22px] bg-transparent border-none z-[20] before:hover:bg-[#959595]" />
      </div>


      <div className={isMenuOpened ? "relative" : "hidden"}>
        <button type='button'
          className='w-full mt-[5px] rounded-[8px] text-white hover:text-white bg-[#46aae9] hover:bg-[#0076c0] p-[10px]'
          onClick={logoutBtnClickHandler}
        >Logout</button>
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
