import { SerializedError } from '@reduxjs/toolkit';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { BooksListModes } from '../types/BooksListMode'
import { FAVORITE_BOOKS_LIST } from "../constants/bookListModes";
import { routes } from "../config";
import { SubmittedFormData } from "./FormBuilder";
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
  
  if ('status' in queryError) {
    //FetchBaseQueryError type object. 
    //Detailed description is resides in either 'error' string type property (network access, data parsing, timeout errors)
    //or in 'data' property which value represents object created from json that came as response from Laravel backend.

    if ('error' in queryError) {
      return queryError.error;

      //Laravel sends the actual error message in json's 'message' field, if it exists then it is accessable in error's data.message field
    } else if (typeof queryError.data === 'object' && queryError.data !== null &&
      'message' in queryError.data && typeof queryError.data.message === 'string') {

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
 * returns error message in form of string or object with errors extracting data from REST API response json in case of HTTP error response
 * (response with non 2** HTTP status) when working with RTK Query endpoint. First trying to find 'errors' field in json and returns error
 * information in form of object where key is submitted data object key and value is error description. This is the case when server is
 * responding with f.e. validation errors on submitted object with multiple fields. If 'errors' field in json is not present, function tries
 * to find 'message' field and return its value as string type message. Actually, when 'errors' json field is not present, current function
 * invokes extractMessageFromQueryErrorObj() function and that function is analysing for 'message' field presence in json, also analyses
 * other function's error objects fields, see extractMessageFromQueryErrorObj function's description.
 * 
 * @param queryError error object returned by RTK Query @reduxjs/toolkit/query/react/createApi query endpoint 
 * @returns 
 */
export function extractMessageOrMessagesObjFromQueryError(queryError: FetchBaseQueryError | SerializedError): StringOrIndexedObject {

  if ('status' in queryError) {
    /*FetchBaseQueryError type object;
    look for 'errors' property as Laravel backend returns validation errors per field in json's field 'errors' property. The example of json
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

    //The json representing object resides in 'data' property of FetchBaseQueryError type object
    if (typeof queryError.data === 'object' && queryError.data !== null &&
      'errors' in queryError.data && typeof queryError.data.errors === 'object' && queryError.data.errors !== null) {

      //transform response errors object. Originally error information for each field is in form of an array of string values (array of
      //error messages for each field), all array items will be joined into single string
      const flatErrorsObject: {[index:string]: string} = {};
      
      const responseErrorsIndexedObj: {[index:string]: unknown} = {...queryError.data.errors};
      for(const fieldTitle in responseErrorsIndexedObj) {
        let transformedErrMessage:string;
        
        if(Array.isArray(responseErrorsIndexedObj[fieldTitle])){
          transformedErrMessage = responseErrorsIndexedObj[fieldTitle].join(',');
        }else{
          //error messages for field should be in array format, but assume there may be returned other format, just convert it to string
          transformedErrMessage = JSON.stringify(responseErrorsIndexedObj[fieldTitle]);
        }

        flatErrorsObject[fieldTitle] = transformedErrMessage
      }

      return flatErrorsObject;


    } else {
      //error did not contain 'errors' property, error description must be in 'message' property, extract it using 
      //extractMessageFromQueryErrorObj function
      return extractMessageFromQueryErrorObj(queryError)
    }


  }else{
    //this is SerializedError type object, analyse it using extractMessageFromQueryErrorObj function
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

/**
 * null is included to accept objects who's property types alongside with string, number or boolean can also be null like
 * {propA: string | null} but finding null runtime values will throw exception
 */
type TTemplateObject = { [key: string]: string | number | boolean | null }

/**
 * Converts form data to an object with structure as template object but values of form data object.
 * Returned object contains same properties as template object taking its values from form data object same named properties with
 * values converted to current runtime type of template object properties. This function in conjunction with FormBuilder component reduces
 * code amount to convert data from defined form to a needed object but with drawback that types can not be fully garded by Typescript -
 * by typing it is possible at most to assure that returned object has same properties as template object but their type is 'unknown'
 * as to achieve data conversion automation indexed syntacs is used in assigning values to target object. Therefore the return value type
 * should be asserted to assignable variable or param type like
 * 
 * const submittedData: MyType = createTargetObjFromSubmittedData(submittedFormData, templateMyTypeObj) as MyType;
 * 
 * therefore it is important to have form definition of FormBuilder component to correctly correspond to template object runtime types.
 * Function detects cases of unconformity with form data type and template object field runtime type and throws error
 * 
 * Target runtime types can be javascript 'string', 'number' or 'boolean' types.
 * It is possibile to assign null value to template object field instead of numeric value if form data string value equals to
 * "" <empty string> or "null" string and field is present in nullable fields list which is usefull for cases when numeric or null value can
 * be assigned for target object field.
 * Not only boolean type form data object field can be converted to target object boolean type field value but also string values 'true' or
 * 'false' is converted to appropriate boolean value allowing to get boolean value not only from checkbox input field but also from select
 * or radio input element
 * 
 * @param formData - form submitted data object which is key-value object, value types may be either string or boolean
 * @param templateObject - object conforming to function's return type, conforms to funtion's generic type argument. The actual property
 * values matters only from perspective of their runtime type, they will be overwritten by data from submitted data object converting data
 * to runtime type of template object.
 * 
 * @returns object of type which is specified in function type generic argument filled with values from submitted form data argument
 * 
 * @throws error if property's value in template object is null and property is present in submitted data object because it is intended that
 * target type of primitive `string | number | boolean` target runtime types the value from submitted data object should be
 * converted to
 */
export function createTargetObjFromSubmittedData<T extends TTemplateObject>(
  formData: SubmittedFormData,
  templateObject: T,
  nullableFields: { [key in keyof T]?: boolean } = {}
): { [key in keyof T]: unknown } {

  //create copy of template object to not modify original, transformed values from form data will be assigned to the copied object
  const templateObjCopy: { [key in keyof T]: unknown } = { ...templateObject }

  let templateObjKey: keyof T;
  for (templateObjKey in templateObjCopy) {
    const blueprintObjFieldVal = templateObjCopy[templateObjKey]

    //create object key string version as formData object can't be indexed with symbol type keys contained in 'templateObjKey' variable,
    //also used in error messages
    const objKeyStrVal = String(templateObjKey)

    const formFieldVal = formData[objKeyStrVal]

    //if form does not have field with template object property name throw error
    if (formFieldVal === undefined) {
      throw new Error(`formData object does not have entry for template object field [${objKeyStrVal}]`)
    }

    //convert form data value to string. Also boolean type value is converted to string runtime type not rising error
    if (typeof blueprintObjFieldVal === 'string') {
      templateObjCopy[templateObjKey] = String(formFieldVal)


      //convert form data value to integer/float runtime value if template object property is of integer/float.
      //Assign null value to resulting object if after parsing form data using parseInt()/parseFloat() functions NaN is returned and current
      //field is in nullable field list and form value is "" <empty string> or "null", otherwise throw error about non numeric string value
    } else if (typeof blueprintObjFieldVal === 'number') {

      if (typeof formFieldVal === 'boolean') {
        throw new Error(`formData object field [${objKeyStrVal}] runtime type is boolean but templete object field [${objKeyStrVal}]
          runtime type is "number". Possible there is error with form definition as boolean type form data comes from checkbox input field
          which is not convertable to numeric value; value must come from input field stored as string type value: select, radio, possibly
          text or number type input field`)
      }

      let fieldStringVal = formFieldVal;

      let fieldNumericVal: number;
      if (Number.isInteger(blueprintObjFieldVal)) {
        fieldNumericVal = parseInt(fieldStringVal)
      } else {
        fieldNumericVal = parseFloat(fieldStringVal)
      }


      //if conversion result is NaN, the value will be converted to null value if nullable fields object has property with name equal to 
      //current field name and form field value either "" <empty string> or "null" string value
      if (isNaN(fieldNumericVal)) {

        const errMsgCommonPart = `formData[${objKeyStrVal}] value "${fieldStringVal}" can not be converted neither to numeric type as defined 
            by template object's [${objKeyStrVal}] property runtime type neither to null as form data value is not in integer/float format`;


        if (nullableFields[templateObjKey] !== true) {
          throw new Error(errMsgCommonPart + ' and property is not in nullable fields list.')

        } else if (fieldStringVal !== '' && fieldStringVal !== 'null') {
          throw new Error(errMsgCommonPart + ', property is present in nullable fields list but is not equal to either "" <empty string> ' +
            'or "null" value as only those non numeric values can be converted to null if present in nullable fields list')

        } else {
          //assigning null value as field is in nullable list and equals to "" <empty string> or "null"
          templateObjCopy[templateObjKey] = null;
        }

      } else {
        //if after conversion to integer/float result is meaningfull numeric value not NaN then use it as resulting object's property value.
        //The main goal of current function is to conveniently convert string literals to integer from 'select' or 'radio' input elements
        //which would contain correct integer format string values usually comeing from database record ID values, therefore
        //parseInt()/parseFloat() was used which returns numeric value if at least first part of string is in numeric format
        templateObjCopy[templateObjKey] = fieldNumericVal
      }



    } else if (typeof blueprintObjFieldVal === 'boolean') {

      //boolean form data runtime value originates from checkbox input field, use value as it is
      if (typeof formFieldVal === 'boolean') {
        templateObjCopy[templateObjKey] = formFieldVal

        //convert 'true' string value to boolean true
      } else if (formFieldVal === 'true') {
        templateObjCopy[templateObjKey] = true

        //convert 'false' string value to boolean false
      } else if (formFieldVal === 'false') {
        templateObjCopy[templateObjKey] = false

      } else {
        throw new Error(`formData[${objKeyStrVal}] value "${formFieldVal}" can not be converted to boolean type as defined by template 
            object's [${objKeyStrVal}] property runtime type as form data value is not boolean true/false neither string "true"/"false"`)
      }

    } else if (blueprintObjFieldVal === null) {
      throw new Error(`template object property with name "${objKeyStrVal}" value is null, must have value other than null to ` +
        "figure out prop's target runtime type")
    }
  }

  return templateObjCopy
}
