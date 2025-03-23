import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQueryParamValue, extractMessageOrMessagesObjFromQueryError } from "../utils/utils";
import { Book } from "../types/Book";
import { useGetBookQuery, useUpdateBookMutation } from "../features/api/apiSlice";
import { skipToken } from '@reduxjs/toolkit/query/react'
import {
  routes,
  bookEditFormFieldsDef } from "../config";
import { H1Heading } from "./ui_elements/H1Heading";
import { ButtonWithIconAndBackground } from "./ui_elements/ButtonWithIconAndBackground";
import { DataFetchingStatusLabel } from "./ui_elements/DataFetchingStatusLabel";
import { GeneralErrorMessage } from "./ui_elements/GeneralErrorMessage";
import { NavLinkBack } from "./ui_elements/NavLinkBack";
import { FormBuilder, SubmittedFormData } from '../utils/FormBuilder';
import DisappearingMessage from './DisappearingMessage';
import { setPageTitleTagValue } from "../utils/setPageTitleTagValue";
import { BookDeletionProcessorForBookEditPage } from "./BookDeletionProcessorForBookEditPage";
import { useTrackEndpointSuccessfulFinishing } from "../hooks/useTrackEndpointSuccessfulFinishing";
import { SerializedError } from '@reduxjs/toolkit';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';


/**
 * This component gets initial data from Redux store but does not use react-redux connect() because we don't need 
 * re-render component after store's state is updated because the new state corresponds to values is that is 
 * currently in input fields.
 */
export function BookEditing() {

  /**
   * TODO dispatches updating thunk to update book data in redux store. Additionally gets excludes get params 
   * from current book edit url by using useNavigate hook's returned function. A "delete" get param can be 
   * page's url value if deleting failed when "Delete book" link was clicked in book edit screen. If get 
   * param would not be removed from url also a delete confirmation modal dialog would be displayed in  
   * response to "delete" get param. 
   * @param {*} submittedFormData 
   */
  async function saveSubmittedData(submittedFormData: SubmittedFormData) {
    //object creation from form data could be automated by including target object's properties types to form definition and
    //asserting that function result is of needed output data relying on correct definition of props' target types. Currently
    //building needed small object hardcoded
    let submittedBookData: Book = {
      id: parseInt(String(submittedFormData.id)),
      title: String(submittedFormData.title),
      author: String(submittedFormData.author),
      preface: String(submittedFormData.preface),
    }

    //saving to state data from mutation response to be snown in form
    try {
      let bookDataFromUpdateResponse = await triggerBookUpdateMutation(submittedBookData).unwrap();
      setFormInitialData(bookDataFromUpdateResponse)
    } catch (error) {
      //not processing error here, it is assigned to variable in book update mutation hook returned object
    }
  }

  //contains book data that will be displayed in form fields. Initially from book data fetching endpoint and later from book updating
  //mutation response data after user submits form.
  const [formInitialData, setFormInitialData] = useState<Book | undefined>();


  const navigate = useNavigate();

  const [triggerBookUpdateMutation, {
    error: bookUpdatingError,
    isLoading: isUpdatingBook }] = useUpdateBookMutation()


  let deleteParamVal = getQueryParamValue("delete");
  //validate delete param val, accepting only "true" string if it is not null because it will be used in hook as dependency
  if (deleteParamVal !== "true") {
    deleteParamVal = null;
  }


  useEffect(() => {
    //setting page title after first render and after deleting query param disappears from URL as deletion processor child component
    //will not override it as it is not snown in that case
    setPageTitleTagValue("Edit book");
  }, [deleteParamVal]);


  //renaming and assigning default value which makes value always to be string type which correctly fits to be used as argument in
  //functions where undefined values are invalid
  let { bookId: bookIdUrlPathParam = "" } = useParams();

  let bookIdParamFormatErrorMsg: string | null = null;

  //initially bookId set to zero. Assign positive integer value created from path parameter it it's format corresponds to integer. 
  //If format is invalid, generate error message
  let bookId = 0;
  if (! /^[1-9][0-9]*$/.test(bookIdUrlPathParam)) {
    bookIdParamFormatErrorMsg = bookIdUrlPathParam + " - invalid parameter value! Value must be integer greater than zero.";

  } else {
    bookId = parseInt(bookIdUrlPathParam)
  }

  //if book id parameter was valid and formInitialData is empty then execute book data fetching query. Query will be executed once resulting
  //in response with book data that will be initially displayed in form or error like "book does not exist" ). When user submits form, the
  //updated book data will be sent back by mutation and displayed in form, data from book data fetching query will not be needed any more.
  const isBookDataQueryToBeExecuted: boolean =
    (bookId !== 0 && formInitialData === undefined)

  const { data: bookData, error: getBookQueryError, isFetching: isGetBookQueryFetching } =
    useGetBookQuery(isBookDataQueryToBeExecuted ? bookId : skipToken);


  useEffect(() => {
    if(bookData !== undefined){
      setFormInitialData(bookData)
    }
  }, [bookData]);
  
  //console.log(' isUpdatingBook, bookUpdatingError, bookDataFromUpdateResponse', isUpdatingBook, bookUpdatingError, bookDataFromUpdateResponse);



  const bookEditUrlWithoutQueryParams = routes.bookEditPath.replace(":bookId", String(bookId));

  const [displaySuccessMsg] = useTrackEndpointSuccessfulFinishing(isUpdatingBook, bookUpdatingError);

  let formDisabled = isUpdatingBook === true;

  let parentListUrl = getQueryParamValue("parentListUrl");

  //link url for returning to list must point to list user came from to current edit page (all books list or 
  //favorites list), same is with redirecting after deleting a book from edit screen
  let backToListUrl = routes.bookListPath;
  if (parentListUrl) {
    backToListUrl = parentListUrl;
  }

  //create current book delete url by adding delete parameter to book edit link.
  //if edit page was opened from other than all books list, parentListUrl get param is to be keeped in delete url
  //to redirect page to same list user opened editing page from in case user confirms or cancels deleting
  let deleteLinkUrl = bookEditUrlWithoutQueryParams + "?delete=true";
  if (parentListUrl) {
    deleteLinkUrl += "&parentListUrl=" + parentListUrl;
  }

  //if user clicks on "Cancel" botton in delete confirmation dialog, page should redirect
  //to book editing url without delete get param, keeping parent list url param
  let deletionCancelActionUrl = bookEditUrlWithoutQueryParams
  if (parentListUrl) {
    deletionCancelActionUrl += "?parentListUrl=" + parentListUrl;
  }

  //show deletion confirmation dialog when deleting get param is set and if form data is not empty which means an
  //existing book id query param is passed as
  let showDeletionConfirmationDialog = false;
  if (formInitialData && deleteParamVal === "true") {
    showDeletionConfirmationDialog = true;
  }

  //from updating endpoint two types of error can be returned. One type results in error where a string error message can be obtained like 
  //"Book with id=<bookId> not found". Other type is validation error which is related to field, the error extractor function returns it in
  //form of object. F.e., if trying to update title and set it to title that already has other book an error object contains object with 
  //'title' field and approprite error message. Error by field is needed to display it next to input field with same name as error object
  //key. It is used in case of book updating endpoint
  let errorMsg: string | null = null
  let validationErrors: { [index:string]: string } | null = null

  let currentErrorFromEndpoint: FetchBaseQueryError | SerializedError | undefined = undefined
  if (getBookQueryError) {
    currentErrorFromEndpoint = getBookQueryError    
  } else if (bookUpdatingError) {
    currentErrorFromEndpoint = bookUpdatingError
  }
  if (currentErrorFromEndpoint) {
    const errMsgOrObject = extractMessageOrMessagesObjFromQueryError(currentErrorFromEndpoint)
    if(typeof errMsgOrObject === 'string'){
      errorMsg = errMsgOrObject
    }else{
      validationErrors = errMsgOrObject
    }
  }
  return (
    <div>
      <NavLinkBack url={backToListUrl} />

      <div className="relative max-w-[700px]">
        <H1Heading headingText="Edit book" />

        {//if url param format is invalid nothing to process, return just error message 
          bookIdParamFormatErrorMsg &&
          <GeneralErrorMessage msgText={bookIdParamFormatErrorMsg} />
        }

        {errorMsg &&
          <GeneralErrorMessage msgText={errorMsg} />
        }

        {/*while fetching book, show that data is loading*/
          isGetBookQueryFetching &&
          <DataFetchingStatusLabel labelText="loading..." />
        }
        {/*while updated data is being sent, show that data is loading*/
          isUpdatingBook &&
          <DataFetchingStatusLabel labelText="updating..." />
        }

        {//after succesful update display message
          displaySuccessMsg &&
          <DisappearingMessage messageText="Changes saved"
            initialDisplayDuration={500} />
        }

        {//display modal deleting confirmation dialog.
          //condition "&& formInitialData" is added to convince Typescipt that value passed to deletableBook is not undefined as
          //TS does not understard that it is done when calculation "showDeletionConfirmationDialog" value
          (showDeletionConfirmationDialog && formInitialData) &&
          <BookDeletionProcessorForBookEditPage deletableBook={formInitialData}
            afterDeletingRedirectUrl={backToListUrl}
            cancelActionUrl={deletionCancelActionUrl} />
        }


        {//book edit form and delete button when book data is loaded
          bookData &&
          <>
            {/*delete button placed on the right top corner of container*/}
            <div className="absolute right-0 top-0">
              <ButtonWithIconAndBackground
                iconName="delete"
                //redirect to delete url on click
                clickHandler={() => { navigate(deleteLinkUrl) }} />
            </div>

            <FormBuilder formFieldsDefinition={bookEditFormFieldsDef}
              submitButtonText="Update"
              initialFormData={formInitialData}
              successfulSubmitCallback={saveSubmittedData}
              initiallyDisplayedErrors={validationErrors}
              disableAllFields={formDisabled} />
          </>
        }

      </div>
    </div>
  )
}