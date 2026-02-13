import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from '../../store/reduxHooks';
import { selectBooksChosenForDeleting, booksChoiceForDeletingCleared } from "../../features/booksSlice";
import { useNavigate } from "react-router-dom";
import { extractMessageFromQueryErrorObj } from "../../utils/utils";
import { useDeleteBookMutation } from "../../features/api/apiSlice";
import { ModalDialog } from "../ModalDialog";
import { DataFetchingStatusLabel } from "../ui_elements/DataFetchingStatusLabel";
import { GeneralErrorMessage } from "../ui_elements/GeneralErrorMessage";
import { Book } from "../../types/Book";

type BookDeletionProcessorProps = {
  allBooksDisplayedInList: Book[] | undefined,
  redirectAfterDeletingUrl?: string,
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
 * @param allBooksDisplayedInList - books array of all books displayed in list, must be passed from parent component; this is the source of
 * data where deletable book title is obtained if single book is deleted
 * @param redirectAfterDeletingUrl - an URL where page should be redirected after deleting is completed e.g. after deleting in book edit
 * page should be redirected to list where user came from
 */

export function BookDeletionProcessorForBooksListPage({
  allBooksDisplayedInList,
  redirectAfterDeletingUrl }: BookDeletionProcessorProps) {

  /**
   * triggers book deletion endpoint
   * Intended to invoke when in modal confirmation dialog user clicks button "Confirm"
   */
  function deleteBooks(deletableBooksIds: number []) {
    dispatch(booksChoiceForDeletingCleared())
    triggerDeleteBookMutation(deletableBooksIds);
  }

  /**
   * Invoked when user clicks "Cancel" option in modal dialog. Dispatches action to Redux store that removes information about
   * chosen deletable books. As a result confirmation modal closes
   */
  function onCancelClickInConfirmationDailog() {
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

  // While books list fetching in parent component, quit executing
  if(allBooksDisplayedInList === undefined){
    return null;
  }

  //if user has not clicked "Confirm" or "Cancel" option yet display confirmation modal dialog
  if (deletableBooksIds !== null) {
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
      cancelFunction={onCancelClickInConfirmationDailog} />


    //user has clicked "Confirm", display deletion progress status, error if deleting error occured 
    //or no markup if deleted successfully. 
  } else {
    if (bookDeletingError) {
      const errorMessage = extractMessageFromQueryErrorObj(bookDeletingError)
      return <GeneralErrorMessage msgText={errorMessage} />

    } else if (isDeletingBook) {
      return <DataFetchingStatusLabel labelText="deleting..." />


      //idle state - books selected for deleting, not deleting, no error
    } else {
      return null;

    }
  }
}