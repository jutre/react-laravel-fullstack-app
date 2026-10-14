import { SerializedError } from '@reduxjs/toolkit';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';

/**
 * This function it intended to be used as a part of "click" event handler attached to attached to window.document. The other part of it
 * must be defined inside React compoent's function using useCallback() hook and invoke current function from it. The function defined
 * in component is an actual event handler attached to window.document, the current function does all the logic.
 * The function checks if click was outside of info div's body and closes the info div in such case.
 * 
 * @param {click Event from the DOM} event - the event argument received by the React's click event handler function 
 * @param {ref to element} beginningOfMenuRef - reference created by React's useRef() hook to a beginning element of
 * info div (contains info div toggler and body) to track the boundaries of info div and to find out whether the click
 * was been done outside of info div anywhere in window.document
 * @param {ref to element} documentRef - reference created by React's useRef() hook to window.document which will be used to remove 
 * click event handler when it the click was outside of menu (for performance issues don't use directly document.removeEventListener())
 * @param {function} docClickEventHandlerIdentifier - reference to the function (the identifier or it) that is defined in React's component  
 * and attached to window.document. The reference is used to remove component's defined function from window.document event listeners
 * @param {*} callback - reference to the function that is defined in React's component and which performs needed state changes
 * or other needed actions in component
 * @returns void
 */
export function closeDivOnClickOutsideOfDiv(
  event: MouseEvent,
  beginningOfMenuRef: React.MutableRefObject<HTMLElement | null>,
  documentRef: React.MutableRefObject<Document>,
  docClickEventHandlerIdentifier: (event: MouseEvent) => void,
  callback: (event?: MouseEvent) => void) {

  //event.target returns object of type "EventTarget | null", it does not have any of "parentElement" that might be used to traverse
  //ancestor nodes, but it is known that click target element is a DOM element which is represented by HTMLElement type
  let eventPropogationPathElement: HTMLElement | null = event.target as HTMLElement;
  while (eventPropogationPathElement) {
    //traverse elements starting from clicked element to every next ancestor.
    //If menu beginning element is found, don't do anytning as we have clicked inside of menu
    if (eventPropogationPathElement === beginningOfMenuRef.current) {
      return;
    }
    eventPropogationPathElement = eventPropogationPathElement.parentElement;
  }

  //we have clicked outside of menu, set menu opened state to false and remove event handler
  callback();
  documentRef.current.removeEventListener('click', docClickEventHandlerIdentifier);
}


/**
 * returns value of URL query parameter of window current location query string. If parameter is not present in URL, returs null.
 * For convenient usage instead of using react-router useSearchParams() hook (make sure component is re-rendered some way if necessary)
 *
 * @param {string} paramName - name of parameter
 * @returns {string | null}
 */
export function getQueryParamValue(paramName: string) {
  const queryParamsString = window.location.search;
  const paramValue = (new URLSearchParams(queryParamsString)).get(paramName);
  return paramValue;
}


/**
 * returns browser cookie value if a cookie with name defined name exists, otherwise returns `undefined`
 * @param {string} key - cookie name 
 * @returns 
 */
export function getCookie(key: string) {
  const b = document.cookie.match("(^|;)\\s*" + key + "\\s*=\\s*([^;]+)");
  if (b === null) {
    return undefined;
  }
  return b.pop();
}


/**
 * Extracts error message in string format from RTK Query endpoint returned error object. The main goal of function is to extract message
 * from REST API responded JSON taking it from 'message' field to display it in UI.
 * Also gets describing message if network access, data parsing or timeout error or SerializedError error is received as argument.
 *
 * Use this function to get general error about endpoint e.g. when reading data to display error like 'resource not found'. When
 * working with endpoints that send data with multiple fields and validation errors per each fields are expected then use
 * extractMessageOrMessagesObjFromQueryError function which extracts error description by field.
 *
 * @param error error object returned by RTK Query @reduxjs/toolkit/query/react/createApi query endpoint
 * @returns extracted string message from error object
 */
export function extractMessageFromQueryErrorObj(error: FetchBaseQueryError | SerializedError): string {

  //narrowed to FetchBaseQueryError type
  if ('status' in error) {

    //object contains 'error' field - the case of network access, data parsing, timeout or custom error
    if ('error' in error) {
      return error.error;

    //the only option left from union type is object {'status': <HTTP response status code>, 'data' <response data> }.
    //Try to extract 'message' field value from response JSON
    } else {
      if (typeof error.data === 'object'
        && error.data !== null
        && 'message' in error.data
        && typeof error.data.message === 'string') {

        return error.data.message;

      } else {
        return `An error with HTTP status ${error.status} occured`;
      }
    }

    //this is SerializedError type object, try to return string value from 'message' field
  } else {
    const errMessage = error.message ?? `An error occured - ${JSON.stringify(error)} occured`
    return errMessage
  }
}

type StringOrIndexedObject = string | { [index:string]: string };

/**
 * extracts error message in form of string or plain object from error object returned by RTK Query endpoint as endpoint can respond with
 * either types of error. First tries to find 'errors' field in response JSON and returns error as object where key is submitted data field
 * name and value is error description which is the case when server is responding with validation errors per submitted object field.
 * If 'errors' field is not present in JSON function returns string type message trying to find it in 'message' JSON field
 * 
 * @param queryError error object returned by RTK Query @reduxjs/toolkit/query/react/createApi query endpoint 
 * @returns 
 */
export function extractMessageOrMessagesObjFromQueryError(queryError: FetchBaseQueryError | SerializedError): StringOrIndexedObject {

  if ('status' in queryError) {
    /*FetchBaseQueryError type object.
    Look for 'errors' property as Laravel backend returns validation errors per field in json's field 'errors' property. The example of json
    send by Laravel - 
    {
      "message": "The title field is required. (and 1 more error)",
      "errors": {
        "title": [
          "The title field is required."
        ],
        "author": [
          "The author field is required."
        ]
      }
    }
    */

    //response JSON resides in 'data' property of FetchBaseQueryError type object
    //and array of errors resides in 'errors' field of JSON
    if (typeof queryError.data === 'object' &&
      queryError.data !== null &&
      'errors' in queryError.data &&
      typeof queryError.data.errors === 'object' &&
      queryError.data.errors !== null) {

      //transform response errors object. Originally error information for each field is in form of an array of string values (array of
      //error messages for each field), all array items will be joined into single string
      const flatErrorsObject: {[index:string]: string} = {};
      
      const responseErrorsIndexedObj: {[index:string]: unknown} = {...queryError.data.errors};
      for(const fieldTitle in responseErrorsIndexedObj) {
        let transformedErrMessage:string;

        //variable instead of indexed access to make type narrowing working
        const errorDescriptionObj = responseErrorsIndexedObj[fieldTitle]

        if(Array.isArray(errorDescriptionObj)){
          transformedErrMessage = errorDescriptionObj.join(',');
        }else{
          //error messages for field should be in array format, but assume there may be returned other format, just convert it to string
          transformedErrMessage = JSON.stringify(errorDescriptionObj);
        }

        flatErrorsObject[fieldTitle] = transformedErrMessage
      }

      return flatErrorsObject;


    } else {
      //FetchBaseQueryError did not contain both 'data' and 'data.errors' properties, extract and return string type error description
      return extractMessageFromQueryErrorObj(queryError)
    }


  }else{
    //this is SerializedError type object, extract and return string type error description
    return extractMessageFromQueryErrorObj(queryError)
  }
}

/**
 * an error object returned by endpoint in {error} field can be object of type FetchBaseQueryError or SerializedError or undefined (no
 * error returned)
 */
type FetchBaseErrorTypes = FetchBaseQueryError | SerializedError | undefined

/**
 * in situations where script has more than one endpoint (f.e, one for data fetching and another for sending updates) and each of them can
 * return error it is needed to find out which of them has returned a non empty error object to extract a message from it. This method lets
 * make code that finds which of error containing variable value is not 'undefined' shorter, it replaces code like
 * 
 * if(firstEndpointError){
 *  activeError = firstEndpointError
 * }else if(secondEndpointError){
 *  activeError = secondEndpointError
 * }else if (anotherEndpointError) {
 *  ...
 * }
 * 
 * @param errors - variables that possibly can have non empty value assigned from endpoint's result object's {error} field, at least two
 * such variables must be passed as parameters to function, parameter number is not fixed
 * 
 * @returns 'undefined' if all of parameter values are 'undefined' or first non 'undefined' value from function parameters
 */
export function findNonEmptyErrorFromList(...errors: [FetchBaseErrorTypes, FetchBaseErrorTypes, ...FetchBaseErrorTypes[]]):
  FetchBaseQueryError | SerializedError | undefined {

  const possiblyNonEmptyError = errors.find(error => error !== undefined)
  return possiblyNonEmptyError
}
