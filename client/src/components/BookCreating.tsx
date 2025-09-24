import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  routes,
  bookCreatingFormFieldsDef
} from "../config";
import { H1Heading } from "./ui_elements/H1Heading";
import { NavLinkBack } from "./ui_elements/NavLinkBack";
import { SquareButton } from './ui_elements/SquareButton';
import { DataFetchingStatusLabel, LABEL_TYPE_ERROR } from "./ui_elements/DataFetchingStatusLabel";
import { ButtonWithIconAndBackground } from './ui_elements/ButtonWithIconAndBackground';
import { FormBuilder, SubmittedFormData } from '../utils/FormBuilder';
import { Book, NewBook } from "../types/Book";
import { useAddBookMutation } from "../features/api/apiSlice";
import DisappearingMessage from './DisappearingMessage';
import { setPageTitleTagValue } from "../utils/setPageTitleTagValue";
import { extractMessageOrMessagesObjFromQueryError,
  createTargetObjFromSubmittedData } from "../utils/utils";


export function BookCreating() {

  //type for convenient outputing of created book data
  type CreatedBookRepresentingObject = { [key: string]: string }

  const [createdBook, setCreatedBook] = useState<CreatedBookRepresentingObject | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    setPageTitleTagValue("Create new book");
  }, []);

  const [triggerAddBookMutation, {
    error,
    isLoading }] = useAddBookMutation()

  const formDisabled = isLoading === true;

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

  async function saveSubmittedData(submittedFormData: SubmittedFormData) {

    const templateNewBookObj: NewBook = {
      title: "",
      author: "",
      preface: "",
      is_favorite: false
    }

    const newBokData: NewBook = createTargetObjFromSubmittedData<NewBook>(submittedFormData, templateNewBookObj)

    //saving to state data from mutation response to display created book data after book successfully saved
    try {
      const bookDataFromBookAddingResponse: Book = await triggerAddBookMutation(newBokData).unwrap();

      //Converting object returned from mutation which is of Book type to CreatedBookRepresentingObject type to be able to access created
      //data using indexed signature when outputting created book data
      const createdBookData: CreatedBookRepresentingObject = {}

      let createdBookObjKey: keyof Book;
      for(createdBookObjKey in bookDataFromBookAddingResponse) {
        let fieldValue = bookDataFromBookAddingResponse[createdBookObjKey];

        //some fields in book form can be empty strings, after submitting to backend they are returned by API as as null. 
        //Convert null to empty string to display submitted book screen same value as submitted by user
        if(fieldValue === null){
          fieldValue = '';
        
        //convert boolean true/false to string 'yes'/'no'
        }else if (typeof fieldValue === 'boolean') {
          fieldValue = fieldValue === true ? 'yes' : 'no';

        //string and number type values are converted to string type
        }else{
          fieldValue = String(fieldValue);
        }

        createdBookData[createdBookObjKey] = fieldValue
      }

      setCreatedBook(createdBookData)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      //not processing error here, it is assigned to variable in book creating mutation hook returned object
    }
  }


  /**
   * when book data is successfully saved component displays "Add another book" link along with saved book data. When user clicks on the
   * link book creation form is displayed. To achieve that createdBook state variable must be set to null
   */
  function handleAddNewBookLinkClick() {
    setCreatedBook(null)
  }


  let mainContent;
  let pageHeading: string;
  //condition to display created book info is createdBook state variable to be not null, it is set to created book data on sucessfull book
  //creation response
  if (createdBook !== null) {
    pageHeading = "Created book"


    //display screen with book infor that just has been created
    const editUrl = routes.bookEditPath.replace(":bookId", String(createdBook.id))
    const addBookButtonContent = <><span className="mr-[7px]">+</span>Add another book</>

    mainContent = (
      <>
        {/*button for adding another book on top right corner*/}
          <SquareButton buttonContent={addBookButtonContent}
            clickHandler={handleAddNewBookLinkClick}
            additionalTwcssClasses="absolute top-0 right-0"/>

        <div>
          <DisappearingMessage messageText="Book was added" initialDisplayDuration={1000} />

          {/*output all fields of just created book. Loop through form fields and output field label with corresponding value from created
          book data object only if it is present on book data object (form definition object can have fields not related to submitted data
          like informative labels, they are not to be outputed as not associated with input field)*/}
          <div className="mb-[15px]">
            {Object.entries(bookCreatingFormFieldsDef).map(([fieldName, fieldOtherInfo]) =>
              fieldName in createdBook
              ? <div key={fieldName}
                  className="flex">
                  <div className="grow-0 shrink-0 basis-[110px] pb-[15px] font-bold capitalize">{fieldOtherInfo.label}:</div>
                  <div className="flex items-center pb-[15px]">{createdBook[fieldName]}</div>
                </div>
              : null
            )}
          </div>

          {/*div with text and button for redirecting to editing url of just created book*/}
          <div onClick={() => { navigate(editUrl) }}
            className="flex items-center cursor-pointer">
            <span className="mr-[5px]">Edit added book</span>
            <ButtonWithIconAndBackground iconName="edit" />
          </div>
        </div>
      </>
    );

  } else {
    pageHeading = "Add book"

    mainContent =
      <FormBuilder formFieldsDefinition={bookCreatingFormFieldsDef}
        successfulSubmitCallback={saveSubmittedData}
        disableAllFields={formDisabled} 
        initiallyDisplayedErrors={validationErrors}/>;
  }

  return (
    <div className="relative">
      <NavLinkBack url={routes.bookListPath} />

      <H1Heading headingText={pageHeading} />

      {/*if data sending has failed, display message*/}
      {errorMsg &&
        <DataFetchingStatusLabel type={LABEL_TYPE_ERROR}
          labelText={errorMsg} />
      }

      {/*while data is being sent, show that data is loading*/}
      {isLoading &&
        <DataFetchingStatusLabel labelText="adding..." />
      }

      <div className="max-w-[700px]">
        {mainContent}
      </div>
    </div>
  )
}
