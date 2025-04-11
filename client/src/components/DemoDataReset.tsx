import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { routes } from "../config";
import { H1Heading } from "./ui_elements/H1Heading";
import { SquareButton } from "./ui_elements/SquareButton";
import { DataFetchingStatusLabel } from "./ui_elements/DataFetchingStatusLabel";
import { GeneralErrorMessage } from "./ui_elements/GeneralErrorMessage";
import { useResetDemoDataMutation } from "../features/api/apiSlice";
import DisappearingMessage from './DisappearingMessage';
import { setPageTitleTagValue } from "../utils/setPageTitleTagValue";
import { extractMessageOrMessagesObjFromQueryError, getQueryParamValue } from "../utils/utils";


export function DemoDataReset() {

  const navigate = useNavigate();

  useEffect(() => {
    setPageTitleTagValue("Demo data reset");
  }, []);

  const [triggerResetDemoDataMutation, {
    error,
    isLoading,
    isSuccess,
    reset }] = useResetDemoDataMutation()

  
  useEffect(() => {
    if(isSuccess === true){
      navigate(routes.demoDataResetPath + '?success=true')
    }
  }, [isSuccess]);

  //detect "success=true" query parameter removal from page URL and reset useResetDemoDataMutation state variable to remove success message.
  //Parameter value change to null value from non-null means user clicked "Demo data reset" menu item after previous successfull data
  //deleting, message neededs to removed 
  let successQueryParameter = getQueryParamValue('success')
  useEffect(() => {
    if (successQueryParameter === null && isSuccess) {
      reset()
    }
  }, [successQueryParameter]);

  let buttonDisabled = isLoading === true;

  //two types of error can be returned from endpoint. One type results in error where a string error message can be obtained like 
  //"500 Internal Server Error". Other type is validation error which contains error related to field, error extractor function returns it
  //in form of object where key is name of submitted object field name and value is error description. F.e., if trying to create book with 
  //title that already exists an error object contains object with 'title' field and approprite error message
  let errorMsg: string | null = null;
  let validationErrors: { [index:string]: string } | null = null;

  if(error){
    const errMsgOrObject = extractMessageOrMessagesObjFromQueryError(error)
    if(typeof errMsgOrObject === 'string'){
      errorMsg = errMsgOrObject
    }else{
      validationErrors = errMsgOrObject
    }
  }

  async function handleResetDataBtnClick() {

    //saving to state data from mutation response to display created book data after book successfully saved
    try {
      await triggerResetDemoDataMutation().unwrap();
    } catch (e) {
      //not processing error here, it is assigned to variable in mutation hook returned object
    }
  }


  let mainContent;
  //on sucessfull response sucess message
  if (isSuccess) {
    mainContent =
      <>
        <div>
          <div className="mb-[15px]">
            Demo data has been reset
          </div>
        </div>
      </>

  } else {
    mainContent =
      <div>
        <div className="mb-[15px]">
          After "Reset demo data" is clicked the books data that is shown in books list will be reset to initial state.
          There will be ten books displayed in books list.
        </div>

        <SquareButton buttonContent="Reset demo data"
          clickHandler={handleResetDataBtnClick}
          disabled={buttonDisabled}/>
      </div>;
  }

  return (
    <div className="relative">
      <H1Heading headingText="Demo data reset" />

      {/*if data sending has failed, display message*/}
      {errorMsg &&
        <GeneralErrorMessage msgText={errorMsg} />
      }

      {/*while data is being sent, show that data is loading*/}
      {isLoading &&
        <DataFetchingStatusLabel labelText="resetting data..." />
      }

      <div className="max-w-[700px]">
        {mainContent}
      </div>
    </div>
  )
}
