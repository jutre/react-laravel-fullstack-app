import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { extractMessageFromQueryErrorObj, getQueryParamValue } from "../../utils/utils";
import { useTrackEndpointSuccessfulFinishing } from "../../hooks/useTrackEndpointSuccessfulFinishing";
import { useDeleteBookMutation } from "../../features/api/apiSlice";
import { ModalDialog } from "../ModalDialog";
import { DataFetchingStatusLabel } from "../ui_elements/DataFetchingStatusLabel";
import { GeneralErrorMessage } from "../ui_elements/GeneralErrorMessage";
import { Book } from "../../types/Book";

type BookDeletionProcessorProps = {
  deletableBooksIds: number[],
  allBooksDisplayedInList: Book[] | undefined,
  booksListPageUrl: string,
}

/**
 * Displays deletion confirmation modal dialog and performs deleting if user confirms deletion.
 * If single book is selected for deleting confirmation message contains deletable book title, if multiple books are selected then
 * message contains amount of selected books. Single book title displaying in confirmation dialog is convenient for user when
 * user clicks "Delete" button next to book title in list.
 * It's also possible to input deletion URL with non existing IDs directly in browser's address bar. When deleting a single book a check for
 * book existance among currently displayed books list is performed. If book is not found an error is displayed; in case deleting
 * multiple books deletable list is sent to backend without any checking.
 * 
 * @param deletableBooksIds - list of deletable books. In case of deleting single book array contains single element
 * @param allBooksDisplayedInList - books array of all books displayed in list, must be passed from parent component; this is the source of
 * data where deletable book title is obtained if single book is deleted
 * @param booksListPageUrl - a book list page url where page should be redirected after book(s) are deleted or deletion is cancelled by
 * user. URL must be of list type (e.g. all books, favorite books) where user clicked deleting button.
 */

export function BookDeletionProcessorForBooksListPage({
  deletableBooksIds,
  allBooksDisplayedInList,
  booksListPageUrl }: BookDeletionProcessorProps) {

  /**
   * triggers book deletion endpoint
   * Intended to invoke when in modal confirmation dialog user clicks button "Confirm"
   */
  function deleteBooks(deletableBooksIds: number []) {
    setIsDeletionConfirmed(true);
    triggerDeleteBookMutation(deletableBooksIds);
  }

  /**
   * redirects to book list page without params that way no book is selected
   * for deletion
   */
  function cancelSelectionForDeleting() {
    navigate(booksListPageUrl);
  }


  //safest way to distinguish that user has clicked "Confirm" option is to maintain a state variable which is explicitly assigned true
  //if user confirmed deletion
  const [isDeletionConfirmed, setIsDeletionConfirmed] = useState(false);


  const navigate = useNavigate();

  const [triggerDeleteBookMutation, {
    error: bookDeletingError,
    isLoading: isDeletingBook }] = useDeleteBookMutation()

    //TODO replace useTrackEndpointSuccessfulFinishing with isSuccess prop from endpoint returned object
  const [deletionEndpointExecFinishedSuccessfully] = useTrackEndpointSuccessfulFinishing(isDeletingBook, bookDeletingError);

  //when deletion endpoint execution finishes successfully redirect page to list where book was deleted from 
  useEffect(() => {
    if (deletionEndpointExecFinishedSuccessfully) {
      navigate(booksListPageUrl)
    }
  }, [deletionEndpointExecFinishedSuccessfully]);

  //if deletion error occured, set page's URL to value which is current page URL with addeded "error=true" query parameter. Additional
  //parameter is needed to force displaying confirmation dialog when user clicks on Delete button in book edit component tring to delete
  //again while error message is displayed. The click on Delete button redirects page to original deletion URL without "error" query
  //parameter which causes current component to re-render, the "error" parameter value change is detected by other userEffect hook and
  //deletion component state is reset to display confirmation dialog. If there is no other way to force
  const { pathname, search: queryParamsString } = useLocation();
  useEffect(() => {
    if (bookDeletingError !== undefined) {
      const pageUrlOnDeletionError = pathname + queryParamsString + '&error=true'
      navigate(pageUrlOnDeletionError)
    }
  }, [bookDeletingError]);

  //detect "error=true" query parameter removal from page URL and reset isDeletionConfirmed state variable to force displaying confirmation
  //dialog again. Parameter value change to null value from non-null means user clicked on Delete button in book edit component attempting
  //to delete once more while error message from previous deletion was displayed
  const errorQueryParameter = getQueryParamValue('error')
  useEffect(() => {
    if (errorQueryParameter === null && isDeletionConfirmed === true) {
      setIsDeletionConfirmed(false)
    }
  }, [errorQueryParameter]);


  // check the case of unsusual interaction with app - user enters list url with delete params and hits "Enter" not using deletion
  // interface button. In such case stop any further processing and don't display dialog until data is fetched by corresponding useQuery
  // hook in books list component as there is no data to be able check deletable book existance among all books.
  // Data is not fetched while primary useQuery is fetching, an error has occured or primary hook has not started fetching yet (current
  // component is rendered before books list component while rendering component tree as it's parent is placed before books list component)
  if(allBooksDisplayedInList === undefined){
    return null;
  }

  //if user has not clicked "Confirm" or "Cancel" option yet display confirmation modal dialog
  if (isDeletionConfirmed === false) {
    let messageAboutBooks;

    //if deleting single book, find it's title to display it in confirmation dialog
    if(deletableBooksIds.length === 1){
      
      //get first array element save way by destructing (instead of gettin by zero index)
      const [bookId] = deletableBooksIds
      const deletableBookInfo: Book | undefined = allBooksDisplayedInList.find((book) => (book.id === bookId))
      //prepare title for dialog message or display error message if book not found (possible page opened by entering URL with non existing
      //book id)
      if(deletableBookInfo){
        messageAboutBooks = '"' + deletableBookInfo.title + '"';

      }else{
        const errorMessage = `Book with id="${bookId}" not found`
        return <GeneralErrorMessage msgText={errorMessage} />
      }

    //if deleting more than one book, prepare deletable book amount to display in confirmation dialog
    }else{
      messageAboutBooks = deletableBooksIds.length + ' books';
    }

    const modalDialogMessage = `Are you sure you want to delete ${messageAboutBooks}?`

    return <ModalDialog content={modalDialogMessage}
      confirmFunction={() => deleteBooks(deletableBooksIds)}
      cancelFunction={cancelSelectionForDeleting} />


    //user has clicked "Confirm", display deletion progress status, error if deleting error occured 
    //or no markup if deleted successfully. 
  } else {
    if (bookDeletingError) {
      const errorMessage = extractMessageFromQueryErrorObj(bookDeletingError)
      return <GeneralErrorMessage msgText={errorMessage} />

    } else if (isDeletingBook) {
      return <DataFetchingStatusLabel labelText="deleting..." />

      //deletion endpoint execution finished successfully, book deleted, return no markup as after this render the
      //useEffect hook will redirect parent list page 
    } else if (deletionEndpointExecFinishedSuccessfully) {
      return null;

    }
  }
}