import { SerializedError } from '@reduxjs/toolkit';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';

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
 * returns value of get parameter from window current location string. If parameter is not present in window.location string, returs null
 *
 * @param {string} paramName - name of parameter
 * @returns {string | null}
 */
export function getQueryParamValue(paramName: string) {
  const queryParamsString = window.location.search;
  let paramValue = (new URLSearchParams(queryParamsString)).get(paramName);
  return paramValue;
}

/**
 * books may be displayed in all books list and in favorites book list. Each list is displayed in it's corresponding url.
 * This function is to be used in situations when it is needed to get a base url for deleting, deleting cancellation url
 * and an url where to redirect after deleting for a supplied list mode (there are all books and favorite books list modes)
 * @param {string} listMode 
 * @returns 
 */
export function getBookListBaseUrl(listMode: string | undefined) {
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
  var b = document.cookie.match("(^|;)\\s*" + key + "\\s*=\\s*([^;]+)");
  if (b === null) {
    return undefined;
  }
  return b.pop();
}


/**
   * intended to extract most appropriate error message from error object returned by RTK Query query endpoint hook.
   * Attempting to extract error message from FetchBaseQueryError or SerializedError. SerializedError type define all object properties
   * as optional fields, if 'SerializedError.message' property is present, it is returned, if not than returns whole error object
   * converted to string. 
   * 
   * @param queryError error object returned by RTK Query @reduxjs/toolkit/query/react/createApi generated query endpoint hook
   * @returns extracted message on undefined if function parameter is undefined
   */
export function extractMessageFromQueryErrorObj(queryError: FetchBaseQueryError | SerializedError): string {
  //console.log('queryError in extractor funct extractMessageFromQueryErrorObj', queryError);
  //this is FetchBaseQueryError type object. Detailed description is resides in either 'error' string type property 
  //or in 'data' unknown type property where data is object representing json that came as response from Laravel backend.
  //As we are communicating with Laravel backend, look for data.message string property to extract error message from
  if ('status' in queryError) {

    if ('error' in queryError) {
      //network access, data parsing, timeout errors in 'error' property
      return queryError.error;

      //Laravel sends the actual error message in json's 'message' field, if it exists then it is accessable in error's data.message field
    } else if (typeof queryError.data === 'object' &&
      queryError.data !== null &&
      'message' in queryError.data &&
      typeof queryError.data.message === 'string') {

      return queryError.data.message;

      //did not find data.message string type property, using error.status which is always present (the HTTP response code)
    } else {
      return `An error with status ${queryError.status} occured`;
    }

    //this is SerializedError type object, might have string "message" property, if absent, return error object as string
  } else {
    return queryError.message ?? 'An error occured - ' + JSON.stringify(queryError);
  }
}
