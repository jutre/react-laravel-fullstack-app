import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/reduxHooks';
import {
  initiateSessionSendLoginCredentials,
  selectSendLoginRequestStatus,
  selectSendLoginRequestError
} from "../features/authSlice";
import { STATUS_PENDING, STATUS_REJECTED } from'../constants/asyncThunkExecutionStatus'
import { FormBuilder, FormFieldsDefinition, SubmittedFormData } from '../utils/FormBuilder';
import { useSetPageTitleTagValue } from "../hooks/useSetPageTitleTagValue";
import { H1Heading } from './ui_elements/H1Heading';

/**
 * Login form which displays already filled e-mail and password fields with correct credentials for quicker user experience on Demo site -
 * user will not have to type them. 
 * Intended to be used instead of standard login form component on site that will be set up for app live demonstration
 */

export function LoginForm() {
  const [wasRenderedForFirstTime, setWasRenderedForFirstTime] = useState(false);

  useEffect(() => {
    setWasRenderedForFirstTime(true)
  }, []);

  useSetPageTitleTagValue("Books app")

  const dispatch = useAppDispatch();

  const loginFormFieldsDef: FormFieldsDefinition = {
    email: {
      label: "E-mail",
      type: "text",
      validationRules: [
        {
          rule: "email"
        },
        {
          rule: "required"
        }
      ]
    },
    password: {
      label: "Password",
      type: "password",
      validationRules: [
        {
          rule: "required"
        }
      ]
    }
  }

  /**
   * sends submitted email, password to login backend
   * 
   * @param submittedData - submitted data from form
   */
  function onSubmit(submittedData: SubmittedFormData) {

    //get email and password string values from submitted form data.
    //Submitted form data type is {[index: string]: string | boolean}, both fields were defined as 'text' type input fields in form
    //definition variable, so convert both values to string type to create object that is passed to login endpoint
    const credentials = {
      email: String(submittedData.email),
      password: String(submittedData.password)
    }

     dispatch(initiateSessionSendLoginCredentials(credentials))
  }


  
  type LoginCredentials = { 
    password?: string,
    email?: string
  }

  //If got rejected response from server (incorrect e-mail/password with 401 HTTP code) then form will be displayed with previously entered
  //e-mail and blank password, actual error message about incorrect e-mail/password received from API will be displayed under the 
  //e-mail field, also any other technical errors will also be displayed here
  
  //Initially form will be filled with correct e-mail and password for quicker demo experience - user does not have to type them
  //Before first render set valid e-mail and password values, they will be displayed in form field. On subsequent renders initial form data
  //will be empty object which does not override entered and submitted value of e-mail field as 'email' prop is not in initial data - this
  //will be needed for case if user changes prefilled e-mail and/or password and they do not match
  let initialFormData: LoginCredentials = {}
  if(!wasRenderedForFirstTime){
    initialFormData = {
      email: "john.doe@example.com",
      password: "password"
    }
  }
  const sendLoginRequestStatus = useAppSelector(selectSendLoginRequestStatus);
  if (sendLoginRequestStatus === STATUS_REJECTED) {
    initialFormData = { password: "" }
  }

  let initiallyDisplayedErrors: { email: string } | null = null
  const sendLoginRequestError = useAppSelector(selectSendLoginRequestError);
  if (sendLoginRequestError) {
    initiallyDisplayedErrors = { email: sendLoginRequestError }
  }


  //disable form while request pending
  const formDisabled = sendLoginRequestStatus === STATUS_PENDING ? true : false;

  let submitButtonText = "Login"
  if(sendLoginRequestStatus === STATUS_PENDING){
    submitButtonText = "Logging in..."
  }
  return (
    <div>
      <H1Heading headingText="Log in" />

      <div className='pb-[20px] max-w-[360px]'>
        <FormBuilder
          formFieldsDefinition={loginFormFieldsDef}
          initialOrOverrideData={initialFormData}
          initiallyDisplayedErrors={initiallyDisplayedErrors}
          successfulSubmitCallback={onSubmit}
          submitButtonText={submitButtonText}
          disableAllFields={formDisabled} />
      </div>

      <div className='rounded-[8px] border-[2px] border-[grey] p-[10px] mt-[12px]'>
        <p>
        To access authenticated part of application enter following data in form fields:<br/>
        <span className='inline-block mt-[12px]'>
          E-mail - john.doe@example.com<br/>
          Password - password
        </span>
        </p>
      </div>

    </div>
  )
}
