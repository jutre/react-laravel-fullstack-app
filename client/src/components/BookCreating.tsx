import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  routes,
  bookCreatingFormFieldsDef,
  customCheckboxCheckmarkClasses,
  chekboxInputClasses } from "../config";
import { H1Heading } from "./ui_elements/H1Heading";
import { NavLinkBack } from "./ui_elements/NavLinkBack";
import { SquareButton } from './ui_elements/SquareButton';
import { DataFetchingStatusLabel, LABEL_TYPE_ERROR } from "./ui_elements/DataFetchingStatusLabel";
import { ButtonWithIconAndBackground } from './ui_elements/ButtonWithIconAndBackground';
import { FormBuilder, SubmittedFormData } from '../utils/FormBuilder';
import { Book, NewBook } from "../types/Book";
import { useAddBookMutation,
  selectAllLiteraryGenres,
  selectLiteraryGenreEntities } from "../features/api/apiSlice";
import { useAppSelector } from '../store/reduxHooks';
import DisappearingMessage from './DisappearingMessage';
import { setPageTitleTagValue } from "../utils/setPageTitleTagValue";
import { extractMessageOrMessagesObjFromQueryError,
  createTargetObjFromSubmittedData,
  convertLiteraryGenresListToOptionsList } from "../utils/utils";


export function BookCreating() {

  //type for convenient outputing of created book data
  type CreatedBookRepresentingObject = { [key: string]: string }

  const [createdBook, setCreatedBook] = useState<Book | null>(null);

  const navigate = useNavigate();

  const literaryGenresList = useAppSelector(selectAllLiteraryGenres);

  //literary genre entities object is used as choosen genre id will be known after form is submitted
  const literaryGenresEntities = useAppSelector(selectLiteraryGenreEntities);


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
      is_favorite: false,
      literary_genre_id: 0
    }

    const newBokData: NewBook = createTargetObjFromSubmittedData(submittedFormData, templateNewBookObj, {literary_genre_id:true}) as NewBook

    //saving to state data from mutation response to display created book data after book successfully saved
    try {
      const bookDataFromBookAddingResponse: Book = await triggerAddBookMutation(newBokData).unwrap();
      setCreatedBook(bookDataFromBookAddingResponse)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      //not processing error here, it is assigned to variable in book creating mutation hook returned object
    }
  }

  /**
   * Converting Book object field values to user friendly values for displaying created book data to user doing mainly two things:
   * 1)converting literary_genre_id numeric value to corresponding literary genre title,
   * 2)converting JS boolean type values to string "yes"/"no" values.
   * Only the fields that are present in book creating form are included in function's returned book representation object, excluding fields
   * that might be added by API when responding to POST request like 'id' field
   * The mentioned conversions are much more convenient to be done in JS function code then doign that in JSX as it involves lots of
   * branching
   * @param bookData
   */
  function convertBookDataToResresentationObj(bookData: Book):CreatedBookRepresentingObject {
    const createdBookData: CreatedBookRepresentingObject = {}

    //preparing passed argument for indexed acces
    const bookObjCopy: { [index: string]: unknown } = { ...bookData }

    for (const formFieldName in bookCreatingFormFieldsDef) {

      //form field must be present in Book type object as created by form defined by same form definition objec, but check field existance
      //and skip non existing fields in Book object preventing runtime crash and as a result a field is not included in created book data
      //table. Field absence might happen if for some reasong API does not include field in response
      if (formFieldName in bookObjCopy === false) {
        continue
      }

      let fieldValue = bookObjCopy[formFieldName]
      let presentationValue = ''

      const isSelectTypeInputField = bookCreatingFormFieldsDef[formFieldName].type === 'select'

      //Convert null value to empty string or string 'unspecified'. Some fields submitted as empty strings are returned by API as as
      //null values or null value is obtained from literary genre select type input field
      if (fieldValue === null) {
        if (isSelectTypeInputField === true) {
          presentationValue = 'unspecified';
        }else{
          presentationValue = ''
        }

        //converting value that was created using 'select' type input field converting the selected option value to corresponding label
        //using same data that was used to construct select input field's options
      } else if (isSelectTypeInputField === true) {
        const fieldNumbericValue = parseInt(String(fieldValue))

        const selectedGenre = literaryGenresEntities[fieldNumbericValue]
        //genre id must be among entities in entities object, but also check case when non existing genre id was suplied (we are dealing
        //with TS record type, in general key value existance in object is not guaranteed)
        if (selectedGenre === undefined) {
          presentationValue = 'unknown genre with id ' + fieldNumbericValue

        } else {
          presentationValue = selectedGenre.title
        }


        //convert boolean true/false to string 'yes'/'no'
      } else if (typeof fieldValue === 'boolean') {
        presentationValue = fieldValue === true ? 'yes' : 'no';

        //string and number type values are converted to string type
      } else {
        presentationValue = String(fieldValue);
      }

      createdBookData[formFieldName] = presentationValue
    }

    return createdBookData
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
    const createdBookPresentationObj = convertBookDataToResresentationObj(createdBook)

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

          {/* output fields of created book. Output only fields that are present in book creation from, getting field names from form
          definition object and book field values from prepared presentation object */}
          <div className="mb-[15px]">
            {Object.entries(bookCreatingFormFieldsDef).map(([fieldName, fieldDefinition]) =>
              <div key={fieldName}
                  className="flex">
                  <div className="grow-0 shrink-0 basis-[110px] pb-[15px] font-bold capitalize">{fieldDefinition.label}:</div>
                  <div className="flex items-center pb-[15px]">{createdBookPresentationObj[fieldName]}</div>
                </div>
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

    const inputElementOptions = {
      literary_genre_id: convertLiteraryGenresListToOptionsList(literaryGenresList)
    }

    mainContent =
      <FormBuilder formFieldsDefinition={bookCreatingFormFieldsDef}
        optionsForSelectOrRadioFields={inputElementOptions}
        submitButtonText="Save"
        successfulSubmitCallback={saveSubmittedData}
        disableAllFields={formDisabled} 
        initiallyDisplayedErrors={validationErrors}
        checkboxCssCls={chekboxInputClasses}
        checkboxFollwingSiblingCssCls={customCheckboxCheckmarkClasses}/>;
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
