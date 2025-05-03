import { useEffect } from 'react';
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


  //If got rejected response from server form will be shown with previously entered e-mail and blank password and error message under the
  //e-mail field received from API. The primary error expected is about e-mail and password not matching, any other error messages
  //received from API will be displayed here
  let initialFormData: { password: "" } | null = null
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
