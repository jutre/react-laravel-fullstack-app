import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { extractMessageFromQueryErrorObj, getQueryParamValue } from "../../utils/utils";
import { useTrackEndpointSuccessfulFinishing } from "../../hooks/useTrackEndpointSuccessfulFinishing";
import { useDeleteBookMutation, apiSlice } from "../../features/api/apiSlice";
import { getCurrentListMode, getExecutableEndpoint } from "./BooksListBody";
import { skipToken } from '@reduxjs/toolkit/query/react'
import { ModalDialog } from "../ModalDialog";
import { DataFetchingStatusLabel } from "../ui_elements/DataFetchingStatusLabel";
import { GeneralErrorMessage } from "../ui_elements/GeneralErrorMessage";
import { Book } from "../../types/Book";
import { BooksListModes } from '../../types/BooksListMode'

type BookDeletionProcessorProps = {
  listMode: BooksListModes
  deletableBooksIds: number[],
  booksListPageUrl: string,
  currentSearchString: string | null
}

/**
 * Displays deletion confirmation modal dialog before deleting single or multiple books and performs deleting if user confirms deletion.
 * For use with book list component. After confirming or canceling deleting page is redirected to book list user initiated deletion from:
 * (all books, filtered or favorite books list).
 * In case a single book is selected for deleting confirmation message displays deletable book title, in case of multiple books selection
 * confirmation message displays an amount of selected books.
 * When deleting a single book a check for book existing among all list's books is performed, if book is not found an error is displayed
 * instead of deletion confirmation message (it's possible to input deletion URL directly in browser's address bar). Technically the check
 * is done amoung already fetched books for the current list using apiSlice.endpoints.<endpoint name>.useQueryState() hook as deletion
 * processor component is not descendant of books list component. Deletion processor for single book works technically in different context
 * this is the reason code for deletion processor for list and single book can not be reused for each other and single book deletion has a
 * dedicated component.In case deleting multiple book their their presence in all books list is not checked.
 * 
 * @param deletableBooksIds - list of deletable books. In case of deleting single book, array contains only one element
 * @param booksListPageUrl - a book list page url where page should be redirected after book(s) are deleted or deletion is cancelled by
 * user. An URL value will be used with react-router useNavigate hook. URL may be books list or favorite books list url depending on parent
 * list where a book editing page was navitated from
 * @param searchString - current search string. Used to determine whether books list works in filtering mode to choose a corresponding
 * RTK Query endpoint (all books of filtered list) where to look for book title when single book is choosen for deleting
 */

export function BookDeletionProcessorForBooksListPage({
  listMode,
  deletableBooksIds,
  booksListPageUrl,
  currentSearchString }: BookDeletionProcessorProps) {

  /**
   * deletes book in redux store and redirects to book list url.
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

  //convert null value to empty string to be able to conveniently pass to filtering endpoint with correct type (endpoint does not accept
  //null as argument)
  if (currentSearchString === null) {
    currentSearchString = ""
  }

  //safest way to distinguish that user has clicked "Confirm" option is to maintain a state variable which is explicitly assigned true
  //if user confirmed deletion
  const [isDeletionConfirmed, setIsDeletionConfirmed] = useState(false);


  const navigate = useNavigate();

  const [triggerDeleteBookMutation, {
    error: bookDeletingError,
    isLoading: isDeletingBook }] = useDeleteBookMutation()


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

  const currentlyDisplayedList = getCurrentListMode(listMode, currentSearchString)
  const executableEndpoint = getExecutableEndpoint(currentlyDisplayedList, currentSearchString)
  //current component depends on data (fetching status, returned data or error) fetched by getBooksList endpoint which is launched in books
  //list component. That data is accessed in this component using getBooksList.useQueryState. Not being descendant of books list component,
  //using useQueryState hook is the most convenient way to get getBooksList endpoint returned data and state
  const { data: booksListQueryData = [], 
    error: booksListQueryError,
    isFetching: isFetchingBooksList } =
    apiSlice.endpoints.getBooksList.useQueryState(executableEndpoint !== 'all_books_query' ? skipToken : undefined);

  //currentData property instead of 'data' property from endpoint returned object is used to get actual payload from server as currentData
  //value becomes undefined in case of error which clears previous search result in case if there is a following search request after
  //previous successful one and it returns error
    const { currentData: booksFilteringQueryData,
      error: booksFilteringQueryError,
      isFetching: isFetchingBooksFiltering } =
      apiSlice.endpoints.getFilteredBooksList.useQueryState(executableEndpoint !== 'filtered_list_query'
        ? skipToken
        : {filterString: currentSearchString});

    const { data: favoriteBooksQueryData = [],
      error: favoriteBooksQueryError,
      isFetching: isFetchingFavoriteBooks } =
      apiSlice.endpoints.getFavoriteBooks.useQueryState(executableEndpoint !== 'favorites_list_query' ? skipToken : undefined)

  //while books query is fetching data or error has occured, don't display deletion confirmation dialog, also don't perform any
  //actions with deleting. Wait until data in book list component is fetched and then display confirmation dialog and perform deletion
  if(isFetchingBooksList || isFetchingBooksFiltering || isFetchingFavoriteBooks ||
    booksListQueryError || booksFilteringQueryError || favoriteBooksQueryError){
    return null;
  }

  //assign to common variable that is used in loop looking for books title when deleting single book
  let allBooksDisplayedInList: Book[] = [];
  if (currentlyDisplayedList === 'favorites_list') {
    allBooksDisplayedInList = favoriteBooksQueryData
  }else if (currentlyDisplayedList === 'filtered_list') {
    allBooksDisplayedInList = booksFilteringQueryData ? booksFilteringQueryData.data : []
  } else {
    allBooksDisplayedInList = booksListQueryData
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