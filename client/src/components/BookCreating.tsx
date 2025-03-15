import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import {
  bookSavingStatusResetToIdle,
  sendNewBookDataToServer,
  selectBookSavingStatus,
  selectLastSavedBookId,
  selectBookFullInfoById,
  STATUS_LOADING,
  STATUS_REJECTED } from "../features/booksSlice";
import { 
  routes,
  bookCreatingFormFieldsDef  } from "../config";
import { H1Heading } from "./ui_elements/H1Heading";
import { NavLinkBack } from "./ui_elements/NavLinkBack";
import { AddBookLink } from "./ui_elements/AddBookLink";
import { DataFetchingStatusLabel, LABEL_TYPE_ERROR } from "./ui_elements/DataFetchingStatusLabel";
import { ButtonWithIconAndBackground } from './ui_elements/ButtonWithIconAndBackground';
import { FormBuilder } from '../utils/FormBuilder';
import { useTrackThunkSuccessfulFinishing } from "../hooks/useTrackEndpointSuccessfulFinishing";
import DisappearingMessage from './DisappearingMessage';
import { setPageTitleTagValue } from "../utils/setPageTitleTagValue";


function BookCreating() {
  let lastSavedBookId = useSelector(state => selectLastSavedBookId(state));
  //actually needed only after successful saving, but useSelector hook must be called directly in component.
  //The result is ignored until the moment book data has been saved
  let createdBookInfo = useSelector(state => selectBookFullInfoById(state, lastSavedBookId));
  
  const dispatch = useDispatch();

  const navigate = useNavigate();

  useEffect(() => {
    //for resetting "bookSavingStatus" state from "rejected" to "idle". It is needed in situation if submitting new book
    //ended up with "rejected" status and user navigated to other page and then came back. 
    //At the moment when user comes back to book creation page the previously set "rejected" book saving status remains unchanged,
    //it must be set to "idle" on first component render 
    dispatch(bookSavingStatusResetToIdle());
    setPageTitleTagValue("Create new book");
  }, []);

  let sendingToServerStatus = useSelector(state => selectBookSavingStatus(state));

  const [displaySuccessMsg, resetDisplaySuccessMsg] = useTrackThunkSuccessfulFinishing(sendingToServerStatus);

  let formDisabled = sendingToServerStatus === STATUS_LOADING;
    
  function saveSubmittedData(bookData){
    dispatch(sendNewBookDataToServer(bookData));
  }


  /**
   * when book data is successfully saved component displays saved book data with link "Add another book". That link
   * url is equal with current page link and when link is clicked component is not re-rendered anyway because
   * react router has no condition to re-render and bring component to initial state when it displays book creation form
   * as it is when user navigates to book creation url from another url. The component is forced to get to state when
   * book creation form is displayed by setting createdBook state to null, all other state variable are already reset to 
   * initial state in hook that tracks readux book data saving function execution state
   */
  function handleAddNewBookLinkClick(){
    resetDisplaySuccessMsg();
  }

  
  let mainContent;
  if(displaySuccessMsg){
    //display screen with book infor that just has been created
    let editUrl = routes.bookEditPath.replace(":bookId", createdBookInfo.id)
    mainContent = (
      <>
        {/*link for adding another book */}
        <div className="absolute top-0 right-0"
          //click event bubles to this container div when user clicks on child anchor element
          onClick={handleAddNewBookLinkClick} >
          <AddBookLink url={routes.createBookPath} linkText="Add another book" />
        </div>

        <div>
          <DisappearingMessage messageText="Book was added" initialDisplayDuration={1000}/>
          
          {/*output all fields of book. Loop through form definition array and get label for each field from
          it and field value from created book*/}
          <div className="mb-[15px]">
            {bookCreatingFormFieldsDef.map((field, index) =>
              <div key={index}
                className="flex">
                <div className="grow-0 shrink-0 basis-[100px] pb-[15px] font-bold">{field.label}:</div>
                <div>{createdBookInfo[field.name]}</div>
              </div>
            )}
          </div>
          
          {/*div with text and button for redirecting to editing url of just created book*/} 
          <div onClick={() => { navigate(editUrl) }}
            className="flex items-center cursor-pointer">
            <span className="mr-[5px]">Edit added book</span>
            <ButtonWithIconAndBackground iconName="edit"/>
          </div>
        </div>
      </>
    );
  }else{
    mainContent = 
      <FormBuilder  formFieldsDefinition={bookCreatingFormFieldsDef} 
                    successfulSubmitCallback={saveSubmittedData}
                    disableAllFields={formDisabled}/>;
  }

  return (
    <div className="relative">
      <NavLinkBack url={routes.bookListPath}/>
      
      <H1Heading headingText="Add book"/>

      {/*if data sending has failed, display message*/}
      {sendingToServerStatus === STATUS_REJECTED &&
        <DataFetchingStatusLabel type={LABEL_TYPE_ERROR}
          labelText="book saving has failed, try again later"/>
      }
      
      {/*while data is being sent, show that data is loading*/}
      {sendingToServerStatus === STATUS_LOADING &&
        <DataFetchingStatusLabel labelText="adding..."/>
      }
      
      <div className="max-w-[700px]">
        {mainContent}
      </div>
    </div>
  )
}


export default BookCreating;