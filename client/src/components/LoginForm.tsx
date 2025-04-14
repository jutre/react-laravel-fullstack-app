
import { useAppDispatch, useAppSelector } from '../store/reduxHooks';
import {
  initiateSessionSendLoginCredentials,
  selectSendLoginRequestStatus,
  selectSendLoginRequestError
} from "../features/authSlice";
import { STATUS_PENDING, STATUS_REJECTED } from'../constants/asyncThunkExecutionStatus.ts'
import { FormBuilder, FormFieldsDefinition, SubmittedFormData } from '../utils/FormBuilder';
import { GeneralErrorMessage } from './ui_elements/GeneralErrorMessage';
import { useState } from 'react';

export function LoginForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | undefined>();
  const dispatch = useAppDispatch();




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
      type: "text",
      validationRules: [
        {
          name: "minLength",
          value: 3,
          message: "field length must be at least three symbols"
        }
      ]
    }
  ]

  function onSubmit(submittedData: SubmittedFormData) {
    console.log('submitted', submittedData);

    const credentials = {
      //submitted form data object's each element can be of type string | boolean, converting any of them to string is safe.
      //The only error possible is logical when form definition is incorrect defining email and/or password as "checkbox" and
      //it's value would be converted to string "true"/"false"
      email: String(submittedData.email),
      password: String(submittedData.password)
    }

    //saving in case credentials are incorrect to display form with previously submitted email
    setSubmittedEmail(credentials.email)

    dispatch(initiateSessionSendLoginCredentials(credentials))
  }


  const sendLoginRequestStatus = useAppSelector(selectSendLoginRequestStatus);
  const sendLoginRequestError = useAppSelector(selectSendLoginRequestError);

  console.log('login form, sendLoginRequestStatus', sendLoginRequestStatus, (new Date().toString()));

  let formDisabled = sendLoginRequestStatus === STATUS_PENDING ? true : false;


  // TODO uncomment after testing let initialFormData: { email?: string } = {}
  // //if got rejected response from server (primary this could be invalid email), show form with previously entered email, 
  // //leaving password blank
  // if (sendLoginRequestStatus === STATUS_REJECTED) {
  //   initialFormData.email = submittedEmail
  //   console.log('set init data email');
  // }

  // TODO remove after testing
  let initialFormData = {email: "john.doe@example.com", password:"password"}
  


  return (
    <div>
      <div style={{ padding: "15px" }} >
        Form fields, submit button
        is disabled: {String(formDisabled)} {sendLoginRequestStatus}
      </div>
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

    </div>
  )
}

