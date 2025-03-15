import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { extractMessageFromQueryErrorObj, getQueryParamValue } from "../../utils/utils";
import { useTrackEndpointSuccessfulFinishing } from "../../hooks/useTrackEndpointSuccessfulFinishing";
import { useDeleteBookMutation } from "../../features/api/apiSlice";
import { ModalDialog } from "../ModalDialog";
import { DataFetchingStatusLabel } from "../ui_elements/DataFetchingStatusLabel";
import { GeneralErrorMessage } from "../ui_elements/GeneralErrorMessage";
import { Book } from "../../types/Book";
/**
 * displays deletion confirmation modal dialog before deleting and performs deleting if user confirmed deletion. After deleting page is
 * redirected to url speficied in properties. If user cancels deleting, deleting is not performed and page is redirected to url
 * specified in properties.
 * 
 * @param deletableBooksList - object containing information about book. "title" property is used to display deletable book title in confirmation
 * dialog, "id" property used to specify argument for API endpoint hook
 * @param {string} afterDeletingRedirectUrl - a book list url where page should be redirected after book is deleted. An URL value will be
 * used with react-router useNavigate hook. URL may be books list or favorite books list url depending on parent list where and editable
 * book page was navitated from
 * @param {string} cancelActionUrl - an url to which page should be redirected if user chooses "cancel" option in confirmation dialog. 
 * It may be books list or favorite books list url
 */

type BookDeletionProcessorProps = {
  deletableBooksList: Book,
  afterDeletingRedirectUrl: string,
  cancelActionUrl: string
}

export function BookDeletionProcessorForBooksListPage({
  deletableBooksList,
  afterDeletingRedirectUrl,
  cancelActionUrl }: BookDeletionProcessorProps) {

  /**
   * deletes book in redux store and redirects to book list url.
   * Intended to invoke when in modal confirmation dialog user clicks button "Confirm"
   */
  function deleteBooks(deletableBooksList: Book) {
    setIsDeletionConfirmed(true);
    triggerDeleteBookMutation([deletableBooksList]);
  }

  /**
   * redirects to book list page without params that way no book is selected
   * for deletion
   */
  function cancelSelectionForDeleting() {
    navigate(cancelActionUrl);
  }

  //safest way to distinguish that user has clicked "Confirm" option is to maintain a state variable which is explicitly assigned true
  //if user confirmed deletion
  const [isDeletionConfirmed, setIsDeletionConfirmed] = useState(false);


  let navigate = useNavigate();

  const [triggerDeleteBookMutation, {
    error: bookDeletingError,
    isLoading: isDeletingBook }] = useDeleteBookMutation()


  const [deletionEndpointExecFinishedSuccessfully] = useTrackEndpointSuccessfulFinishing(isDeletingBook, bookDeletingError);

  //when deletion endpoint execution finishes successfully value returned by hook becomes true
  useEffect(() => {
    if (deletionEndpointExecFinishedSuccessfully) {
      navigate(afterDeletingRedirectUrl)
    }
  }, [deletionEndpointExecFinishedSuccessfully]);

  //if deletion error occured, set page's URL to value which is current page URL with addeded "error=true" query parameter. Additional
  //parameter is needed to force displaying confirmation dialog when user clicks on Delete button in book edit component tring to delete
  //again while error message is displayed. The click on Delete button redirects page to original deletion URL without "error" query
  //parameter which causes current component to re-render, the "error" parameter value change is detected by other userEffect hook and
  //deletion component state is reset to display confirmation dialog. If there is no other way to force
  let { pathname, search: queryParamsString } = useLocation();
  useEffect(() => {
    if (bookDeletingError !== undefined) {
      let pageUrlOnDeletionError = pathname + queryParamsString + '&error=true'
      navigate(pageUrlOnDeletionError)
    }
  }, [bookDeletingError]);

  //detect "error=true" query parameter removal from page URL and reset isDeletionConfirmed state variable to force displaying confirmation
  //dialog again. Parameter value change to null value from non-null means user clicked on Delete button in book edit component attempting
  //to delete once more while error message from previous deletion was displayed
  let errorQueryParameter = getQueryParamValue('error')
  useEffect(() => {
    if (errorQueryParameter === null && isDeletionConfirmed === true) {
      setIsDeletionConfirmed(false)
    }
  }, [errorQueryParameter]);


  //display confirmation modal dialog when user has not clicked "Confirm" or "Cancel" option
  if (isDeletionConfirmed === false) {
    let modalDialogMessage = `Are you sure you want to delete "${deletableBook.title}"?`

    return <ModalDialog content={modalDialogMessage}
      confirmFunction={() => deleteBooks(deletableBook)}
      cancelFunction={cancelSelectionForDeleting} />


    //user has clicked "Confirm", display deletion progress status, error if deleting error occured 
    //or no markup if deleted successfully. 
  } else {
    if (bookDeletingError) {
      let errorMessage = extractMessageFromQueryErrorObj(bookDeletingError)
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