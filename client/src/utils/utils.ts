import { SerializedError } from '@reduxjs/toolkit';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { BooksListModes } from '../types/BooksListMode'
import { FAVORITE_BOOKS_LIST } from "../constants/bookListModes";
import { routes } from "../config";

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
 * books may be displayed in all books list and in favorites book list. Each list is displayed in it's corresponding url.
 * This function is to be used in situations when it is needed to get a base url for deleting, deleting cancellation url
 * and an url where to redirect after deleting for a supplied list mode (there are all books and favorite books list modes)
 * @param {string} listMode 
 * @returns 
 */
export function getBookListBaseUrl(listMode: BooksListModes) {
  if (listMode === FAVORITE_BOOKS_LIST) {
    return routes.favoriteBooksListPath;
  } else {
    return routes.bookListPath
  }
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
   * returns string format error message extracted from REST API response json 'message' field in case of HTTP error response (response
   * with non 2** HTTP status) when working with RTK Query endpoint.
   * 
   * RTK Query endpoint returns a FetchBaseQueryError type error object on response with non 2** HTTP status, it's 'data' property contains
   * object that represents json returned in API response. The error message is expected to be in 'message' field of json, json is expected
   * to be in following format -
   * {
   *  "message": "Actual error message",
   *  "otherField":"value",
   *  ...
   * }.
   * Function returns 'message' field if it's present in json, if not, returns a string "An error with status <HTTP status code> occured"
   * 
   * FetchBaseQueryError object is also returned on errors not directly connected with HTTP response data like network access, data 
   * parsing, timeout errors. On such type errors the 'error' field is present and it's value is returned as string message.
   * 
   * RTK Query endpoint can also return a SerializedError type error possibly related to other runtime errors, on such error return it's
   * 'message' field or if field absent, return whole error object converted to string.
   *  
   * Use this function when working with endpoints that read data when general errors like 'resource not found' are expected. When
   * working with endpoints that send data with multiple fields for storing and validation errors separatelly for each fields is expected,
   * use extractMessageOrMessagesObjFromQueryError function which extracts more detailed error description then just string.
   * 
   * @param queryError error object returned by RTK Query @reduxjs/toolkit/query/react/createApi query endpoint
   * @returns extracted string message from error object
   */
export function extractMessageFromQueryErrorObj(queryError: FetchBaseQueryError | SerializedError): string {
  
  //FetchBaseQueryError type object.
  //Detailed description is resides in either FetchBaseQueryError object 'error' field or in response JSON 'message' field
  if ('status' in queryError) {

    //errors not from response JSON but present in FetchBaseQueryError: network access, data parsing, timeout errors
    if ('error' in queryError) {
      return queryError.error;

    //error from JSON object. JSON object resides in 'data' property of FetchBaseQueryError, Laravel sends the actual error message
    //in 'message' JSON field
    } else if (typeof queryError.data === 'object' &&
      queryError.data !== null &&
      'message' in queryError.data &&
      typeof queryError.data.message === 'string') {

      return queryError.data.message;

      //no data.message string type property found, returns message containing 'status' property which is always present according to type
    } else {
      return `An error with status ${queryError.status} occured`;
    }

    //this is SerializedError type object, might have string 'message' property, if absent, return error object as string
  } else {
    return queryError.message ?? 'An error occured - ' + JSON.stringify(queryError);
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
