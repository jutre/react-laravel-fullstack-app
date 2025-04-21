import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/reduxHooks';
import {
  initiateSessionSendLoginCredentials,
  selectSendLoginRequestStatus,
  selectSendLoginRequestError
} from "../features/authSlice";
import { STATUS_PENDING, STATUS_REJECTED } from'../constants/asyncThunkExecutionStatus.ts'
import { FormBuilder, FormFieldsDefinition, SubmittedFormData } from '../utils/FormBuilder';
import { GeneralErrorMessage } from './ui_elements/GeneralErrorMessage';
import { setPageTitleTagValue } from "../utils/setPageTitleTagValue";

export function LoginForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | undefined>();
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
          name: "minLength",
          value: 3,
          message: "field length must be at least three symbols"
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
          value: 3,
          message: "field length must be at least three symbols"
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

    dispatch(initiateSessionSendLoginCredentials(credentials))
  }


  const sendLoginRequestStatus = useAppSelector(selectSendLoginRequestStatus);
  const sendLoginRequestError = useAppSelector(selectSendLoginRequestError);

  let formDisabled = sendLoginRequestStatus === STATUS_PENDING ? true : false;


  let initialFormData: { email?: string } = {}
  //if got rejected response from server (primary this could be invalid email), show form with previously entered email,
  //leaving password blank
  if (sendLoginRequestStatus === STATUS_REJECTED) {
    initialFormData.email = submittedEmail
  }

  return (
    <div className='max-w-[700px]'>
      <div className='pb-[20px]'>
        <FormBuilder
          formFieldsDefinition={loginFormFieldsDef}
          initialFormData={initialFormData}
          successfulSubmitCallback={onSubmit}
          submitButtonText="Login"
          disableAllFields={formDisabled} />
      </div>

      {(sendLoginRequestStatus === "pending") &&
        <div>submitting...</div>
      }

      {sendLoginRequestError &&
        <GeneralErrorMessage msgText={sendLoginRequestError} />
      }

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
