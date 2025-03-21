import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  routes,
  bookCreatingFormFieldsDef
} from "../config";
import { H1Heading } from "./ui_elements/H1Heading";
import { NavLinkBack } from "./ui_elements/NavLinkBack";
import { AddBookLink } from "./ui_elements/AddBookLink";
import { DataFetchingStatusLabel, LABEL_TYPE_ERROR } from "./ui_elements/DataFetchingStatusLabel";
import { ButtonWithIconAndBackground } from './ui_elements/ButtonWithIconAndBackground';
import { FormBuilder, SubmittedFormData } from '../utils/FormBuilder';
import { Book, NewBook } from "../types/Book";
import { useAddBookMutation } from "../features/api/apiSlice";
import DisappearingMessage from './DisappearingMessage';
import { setPageTitleTagValue } from "../utils/setPageTitleTagValue";
import { extractMessageFromQueryErrorObj } from "../utils/utils";


export function BookCreating() {

  const [createdBook, setCreatedBook] = useState<SubmittedFormData | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    setPageTitleTagValue("Create new book");
  }, []);

  const [triggerAddBookMutation, {
    error,
    isLoading }] = useAddBookMutation()

  let formDisabled = isLoading === true;

  let errorMsg: string | null = null;
  if(error){
    errorMsg = extractMessageFromQueryErrorObj(error)
  }

  async function saveSubmittedData(submittedFormData: SubmittedFormData) {
    const newBokData: NewBook = {
      title: String(submittedFormData.title),
      author: String(submittedFormData.author),
      preface: String(submittedFormData.preface),
    }

    //saving to state data from mutation response to display created book data after book successfully saved
    try {
      let bookDataFromBookAddingResponse: Book = await triggerAddBookMutation(newBokData).unwrap();

      //Converting object returned from mutation which is of Book type to SubmittedFormData type as SubmittedFormData
      //is easy to access using indexed signature (objVar[keyVar]), but it is not possible to access Book type object values using index
      //access syntacs in TS in valid way without creating type guards which makes code more complex
      const createdBookData: SubmittedFormData = {}

      let createdBookObjKey: keyof Book;
      for(createdBookObjKey in bookDataFromBookAddingResponse) {
        let fieldValue = bookDataFromBookAddingResponse[createdBookObjKey];
        //some fields in book form be empty, they are returned by API as as null, convert null to empty string to display submitted book
        //screen same value as submitted by user
        if(fieldValue === null){
          fieldValue = '';
        }
        createdBookData[createdBookObjKey] = String(fieldValue);
      }

      setCreatedBook(createdBookData)
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
  //condition to display created book info is createdBook state variable to be not null, it is set to created book data on sucessfull book
  //creation response
  if (createdBook !== null) {
    //display screen with book infor that just has been created
    let editUrl = routes.bookEditPath.replace(":bookId", String(createdBook.id))
    mainContent = (
      <>
        {/*link for adding another book */}
        <div className="absolute top-0 right-0"
          //click event bubles to this container div when user clicks on child anchor element
          onClick={handleAddNewBookLinkClick} >
          <AddBookLink url={routes.createBookPath} linkText="Add another book" />
        </div>

        <div>
          <DisappearingMessage messageText="Book was added" initialDisplayDuration={1000} />

          {/*output all fields of just created book. Loop through form fields and output field label with corresponding value from created
          book data object only if it is present on book data object (form definition object can have fields not related to submitted data
          like informative labels, they are not to be outputed as not associated with input field)*/}
          <div className="mb-[15px]">
            {bookCreatingFormFieldsDef.map((field) =>
              field.name in createdBook
              ?<div key={field.name}
                  className="flex">
                  <div className="grow-0 shrink-0 basis-[100px] pb-[15px] font-bold">{field.label}:</div>
                  <div>{createdBook[field.name]}</div>
                </div>
              :null
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
    mainContent =
      <FormBuilder formFieldsDefinition={bookCreatingFormFieldsDef}
        successfulSubmitCallback={saveSubmittedData}
        disableAllFields={formDisabled} />;
  }

  return (
    <div className="relative">
      <NavLinkBack url={routes.bookListPath} />

      <H1Heading headingText="Add book" />

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
