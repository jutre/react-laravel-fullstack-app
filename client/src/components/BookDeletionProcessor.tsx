import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from '../store/reduxHooks';
import { selectBooksChosenForDeleting, booksChoiceForDeletingCleared } from "../features/booksSlice";
import { useNavigate } from "react-router-dom";
import { extractMessageFromQueryErrorObj } from "../utils/utils";
import { useDeleteBookMutation } from "../features/api/apiSlice";
import { ModalDialog } from "./ModalDialog";
import { DataFetchingStatusLabel } from "./ui_elements/DataFetchingStatusLabel";
import { GeneralErrorMessage } from "./ui_elements/GeneralErrorMessage";
import { Book } from "../types/Book";

type BookDeletionProcessorProps = {
  allBooksDisplayedInList: Book[] | undefined,
  redirectAfterDeletingUrl?: string,
}

/**
 * Displays deletion confirmation modal dialog and performs deleting if deletion confirmed. Usable in book edit page and book list pages.
 * If single book is selected for deleting confirmation message contains deletable book title, if multiple books then message contains
 * amount of selected books.
 * 
 * @param allBooksDisplayedInList - array of all books displayed in list or array containing single book being edited, must be passed from
 * parent component; this is the source of data where deletable book title is obtained if single book is chosen to be deleted
 * @param redirectAfterDeletingUrl - an URL where page should be redirected after deleting is completed e.g. after deleting in book edit
 * page a redirect should be performed to list where user chose book for editing
 */

export function BookDeletionProcessor({
  allBooksDisplayedInList,
  redirectAfterDeletingUrl }: BookDeletionProcessorProps) {

  /**
   * Dispathes Redux action to hide modal dialog, invokes book deletion endpoint
   * Intended to invoke when in modal confirmation dialog user clicks button "Confirm"
   */
  function deleteBooks(deletableBooksIds: number []) {
    dispatch(booksChoiceForDeletingCleared())
    triggerDeleteBookMutation(deletableBooksIds);
  }

  /**
   * Invoked when user clicks "Cancel" option in modal dialog. Dispatches Redux action removes information about
   * chosen deletable books. As a result confirmation modal is removed from markup
   */
  function onCancelClick() {
    dispatch(booksChoiceForDeletingCleared())
  }

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [triggerDeleteBookMutation, {
    error: bookDeletingError,
    isLoading: isDeletingBook,
    isSuccess,
  }] = useDeleteBookMutation()


  //when deletion endpoint execution finishes successfully optionally redirect page to some other location
  useEffect(() => {
    if (isSuccess === true &&
      redirectAfterDeletingUrl) {

      navigate(redirectAfterDeletingUrl)
    }
  }, [isSuccess]);


  const deletableBooksIds = useAppSelector((state) => selectBooksChosenForDeleting(state));

  //While single book or list is fetching in parent component there are not any of them displayed - nothing to delete.
  //Placed here because of hook rules
  if(allBooksDisplayedInList === undefined){
    return null;
  }

  //User has pressed delete or batch delete button - display confirmation modal dialog
  if (deletableBooksIds !== null) {
    let messageAboutBooks;

    //if deleting single book, find it's title to display it in confirmation dialog
    if(deletableBooksIds.length === 1){
      
      const [bookId] = deletableBooksIds
      const deletableBookInfo: Book | undefined = allBooksDisplayedInList.find((book) => (book.id === bookId))

      //prepare title for dialog message or display error message if book not found which is possible when page opened by entering
      //deletion URL with non existing book id
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

    return <ModalDialog message={modalDialogMessage}
      confirmFunction={() => deleteBooks(deletableBooksIds)}
      cancelFunction={onCancelClick} />


    //no any books selected for deleting - modal dialog is hidden.
    //Dialog is also hidden if user confirms deleting - show possible loading or error statuses from deleting endpoint
  } else {
    if (bookDeletingError) {
      const errorMessage = extractMessageFromQueryErrorObj(bookDeletingError)
      return <GeneralErrorMessage msgText={errorMessage} />

    } else if (isDeletingBook) {
      return <DataFetchingStatusLabel labelText="deleting..." />

    } else {
      return null
    }
  }
}
