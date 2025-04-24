import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/reduxHooks';
import {
  initiateSessionSendLoginCredentials,
  selectSendLoginRequestStatus,
  selectSendLoginRequestError
} from "../features/authSlice";
import { STATUS_PENDING, STATUS_REJECTED } from'../constants/asyncThunkExecutionStatus'
import { FormBuilder, FormFieldsDefinition, SubmittedFormData } from '../utils/FormBuilder';
import { setPageTitleTagValue } from "../utils/setPageTitleTagValue";

export function LoginForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | undefined>();
  const [submittedPasswd, setSubmittedPasswd] = useState<string | undefined>();
  const dispatch = useAppDispatch();


  useEffect(() => {
    setPageTitleTagValue("Books app");
  }, []);


  const loginFormFieldsDef: FormFieldsDefinition = [
    {
      label: "E-mail",
      name: "email",
      type: "text",
      validationRules: [
        {
          name: "email"
        },
        {
          name: "minLength",
          value: 3
        }
      ]
    },
    {
      label: "Password",
      name: "password",
      type: "password",
      validationRules: [
        {
          name: "minLength",
          value: 8
        }
      ]
    }
  ]

  /**
   * sends submitted email, password to login backend; saves entered email to state
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

    //saving email in case credentials are incorrect to display form with previously submitted email
    setSubmittedEmail(credentials.email)
    setSubmittedPasswd(credentials.password)

    dispatch(initiateSessionSendLoginCredentials(credentials))
  }


  const sendLoginRequestStatus = useAppSelector(selectSendLoginRequestStatus);

  //if got rejected response from server form will be shown with previously entered e-mail in e-mail field and blank password and received
  //error message under the e-mail field. The primary error expected is error message about e-mail (username) and password not matching,
  //also any other possible error messages received from API will be displayed under e-mail field
  type FormInitialData = { email: string, password?: string } | null
  let initialFormData: FormInitialData = null
  //set email and password as initial form data as soon as the are submitted. This is needed to be display non empty fields while form is
  //loading (and disabled). We need to set email to initial data as soon form is submited because of how FormBuilder works - if initial data
  //would not have email field after login is submitted again after previous error (error is removed after re-submitting) the email field
  //would be bland while loading (form disabled)
  if (submittedEmail !== undefined && submittedPasswd !== undefined) {
    initialFormData = {
      email:  submittedEmail,
      password:  submittedPasswd
    }

    //actual error case, setting password to empty, email stays filled with previous imput
    if(sendLoginRequestStatus === STATUS_REJECTED){
      delete initialFormData.password
    }
  }

  const sendLoginRequestError = useAppSelector(selectSendLoginRequestError);
  let initiallyDisplayedErrors: { email: string } | null = null
  if (sendLoginRequestError) {
    initiallyDisplayedErrors = { email: sendLoginRequestError }
  }


  //disable form while request pending
  let formDisabled = sendLoginRequestStatus === STATUS_PENDING ? true : false;

  let submitButtonText = "Login"
  if(sendLoginRequestStatus === STATUS_PENDING){
    submitButtonText = "Logging in..."
  }
  return (
    <div className='max-w-[700px]'>
      <div className='pb-[20px]'>
        <FormBuilder
          formFieldsDefinition={loginFormFieldsDef}
          initialFormData={initialFormData}
          initiallyDisplayedErrors={initiallyDisplayedErrors}
          successfulSubmitCallback={onSubmit}
          submitButtonText={submitButtonText}
          disableAllFields={formDisabled} />
      </div>


      <div className='rounded-[8px] border-[2px] border-[grey] p-[10px] mt-[12px]'>
        <p>
        To access authencicated part of application enter following data in form fields:<br/>
        <span className='inline-block mt-[12px]'>
          E-mail - john.doe@example.com<br/>
          Password - password
        </span>
        </p>
      </div>

    </div>
  )
}
