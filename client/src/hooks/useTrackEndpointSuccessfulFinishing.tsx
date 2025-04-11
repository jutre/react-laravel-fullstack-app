import { useState, useEffect } from "react";


/**
 * Hook for using in components where it is needed to track that endpoint (query or mutation) was executing and execution had finished 
 * successfully by analysing endpoint's returned result flag values. Intended for capturing that endpoint that modifies or deletes
 * objects on server had ended successfully and displaying success message or redirecting to other page.
 * 
 * After endpoint was executing and finished successfully current hook re-renders component where it is used and hook's returned array first
 * element's value becomes true. When endpoint starts execution again, hook's returned array first element's value becomes false.
 * 
 * There may be logic in React component that uses current hook that is dependant on current hook's returned array first element value and
 * also requires possibility to set first array element to "false" again, this hook lets do that by invoking reset function available in
 * hooks returned array.
 * 
 * 
 * @param isLoadingFlag - RTK Query generated endpoint's returned object's 'isLoading' field value (if used for queries not mutations also 
 * 'isFetching' prop value can be used to track if data quering ended successfully)
 * @param error - RTK Query generated endpoint's returned object's 'error' field value
 * 
 * @returns array - array with two elements: first element is boolean value that is set to boolean 'true' after endpoint execution finished
 * successfully, second is function that sets returned array first element to boolean 'false'.
 * First element is set to "true" when hook is invoked subsequentelly two times: first time with parameter values
 * (isLoadingFlag=true, error=undefined) and after that with values (isLoadingFlag=false, error=undefined) which corresponds to endpoint
 * first being in loading state and execution finishing successfully after that; if on second hook's invocation 'error' parameter is set
 * no non undefined value then first array element stays 'false'. 
 * Second element is function that when invoked sets hook's internal state variable to 'false', if it was 'true' before than parent
 * component is re-rendered and hook's returned array first element becomes 'false'.
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
   * function that lets set current hook's returned array first element to "false", it is returned by current hook as array second element.
   * 
   * */
  function resetDisplaySuccessMsg() {
    setDisplaySuccessMsg(false);
  }

  return [displaySuccessMsg, resetDisplaySuccessMsg];
}