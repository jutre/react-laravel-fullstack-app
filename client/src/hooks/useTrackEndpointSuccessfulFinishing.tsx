import { useState, useEffect } from "react";


/**
 * Hook for using in components where it is needed to track that endpoint (query or mutation) was executing and execution had finished 
 * successfully by analysing endpoint's returned result flag values. Intended for capturing that endpoint that modifies or deletes
 * objects on server had ended successfully and displaying success message or redirecting to other page.
 * 
 * After endpoint was executing and finished successfully current hook re-renders component where it is used and hook's returned array first
 * element's value becomes true. When endpoint starts execution again, hook's returned array first element's value becomes false
 * 
 * Captures that thunk was executing and terminated seccessfully, setting first variable in array returned by
 * hook to true
 * 
 * @param string asyncThunkExecutionStatus - current execution status of redux async thunk passed from component
 * @returns array - first array element is set to "true" when hook was called subsequentelly with parameter value
 * first with "pending" and after with "idle" which corresponds to thunks execution being executed and finishing 
 * successfully;
 * first array element - function to reset hooks returnes array first element - see description of function
 * resetDisplaySuccessMsg() in compnent's body
 */
export function useTrackEndpointSuccessfulFinishing(isLoadingFlag: boolean, error: unknown): [boolean, () => void] {
  //previous status info is needed to know that endpoint had been loading previously when a successful execution finishing condition 
  //(isLoadingFlag === true and error === undefined) is met as condition is met even if endpoint did not execute yet, those are default
  //execution flag and error values when a mutation endpoint did not execute for first time and current useEffect hook exucutes at leat once
  //and on first run the (isLoadingFlag === true and error === undefined) is already met
  const [previousIsLoadingFlag, setPreviousIsLoadingFlag] = useState<boolean>(false);

  //when endpoint finishes loading successfully, will be set to true and parent component will be re-rendered
  const [displaySuccessMsg, setDisplaySuccessMsg] = useState<boolean>(false);

  useEffect(() => {
    //when starts loading, set this fact to previous loading flag state and set success message not to be shown
    if (isLoadingFlag === true) {
      setPreviousIsLoadingFlag(true);
      setDisplaySuccessMsg(false);

      //current isLoadingFlag is false, not loading, if no error defined, finished successfully, set success message to be shown
    } else if (previousIsLoadingFlag === true) {
      if (error === undefined) {
        setDisplaySuccessMsg(true); 
      }
      //reset previousIsLoadingFlag state variable to false to be ready for tracking next loading state changes
      setPreviousIsLoadingFlag(false);
    } 
  }, [isLoadingFlag, error]);


  /**
   * in situations where after successfull thunk execution instead of success message a created object is displayed when
   * this hook's returned displaySuccessMsg is true and there is a functionality to "create another object", a way to set 
   * displaySuccessMsg variable to "false" is needed to display initial screen with form for repatative submittion. As
   * displaySuccessMsg value comes to component from this hook, return this function for setting displaySuccessMsg to "false"
   * in this hook
   */
  function resetDisplaySuccessMsg() {
    setDisplaySuccessMsg(false);
  }

  console.log('useTrackEndpointSuccessfulFinishing - returns');
  return [displaySuccessMsg, resetDisplaySuccessMsg];
}