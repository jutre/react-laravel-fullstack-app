
import { BooksListModes } from '../../types/BooksListMode'
import { useSearchParams } from "react-router-dom";
import { getBookListBaseUrl } from "../../utils/utils";
import { BookDeletionProcessorForBooksListPage } from "./BookDeletionProcessorForBooksListPage";
import { GeneralErrorMessage } from "../ui_elements/GeneralErrorMessage";
import { Book } from "../../types/Book";


/**
 * This component processes page's URL "deleteId" query parameter value.
 * If "deleteId" param is present then delete processing component is output which displays confirmation modal dialog and performs deleting.
 * Parameter is validated to contain only comma separated integers. In case of invalid input error message is output
 * 
 * URL query params processing is done in separate component for optimisation purpose as any URL query parameter value change
 * triggers component's re-render through react-router API, if placed directly in book list the list would also re-render.
 * 
 * @param listMode - indicates current mode books list is currently working in - all books list or favorites books list. Value is used
 * to calculate base URL when creating links for deletion confirmation dialog. If page displays favorite books list, after deleting page
 * must be redirected to favorites books list for which an appropriate URL query param is added
 * @param allBooksDisplayedInList - all books passed as books list to parent component that creates list HTML markup, will be passed
 * to component performing the deletion
 * @param currentFilterString - 
 */

type UrlDeleteQueryParamProcessorProps = {
  listMode: BooksListModes | undefined,
  allBooksDisplayedInList: Book[] | undefined,
  currentFilterString?: string,

}

export function DeleteUrlQueryParamProcessor({ 
  listMode,
  allBooksDisplayedInList,
  currentFilterString }: UrlDeleteQueryParamProcessorProps) {

  const [searchParams] = useSearchParams()

  //
  //process book deletion get parameter in url 
  //
  const deletableBooksIdsArr: number[] = [];
  const deleteBookIdParamVal = searchParams.get("deleteId");
  //used for showing error messages
  let errorMessage;
  let displayDeletionConfirmationDialog = false;

  //the url of book list (general or favorites list) page will be redirected to after deletion is confirmed or canceled; keep also search
  //query param (may delete a book from filtered list, must be redirected to list with same search string as other books may still found by
  //current search string)
  let currentBookListUrl = getBookListBaseUrl(listMode);
  if (currentFilterString) {
    currentBookListUrl += "?search=" + currentFilterString
  }

  if (deleteBookIdParamVal) {
    //delete id must be string consisting of comma separated positive integers. List of integers is used in case of deleting multiple
    //selected books
    if (!/^([1-9][0-9]*)(,[1-9][0-9]*)*$/.test(deleteBookIdParamVal)) {
      errorMessage =
        `Invalid "deleteId" parameter value "${deleteBookIdParamVal}"! Value must be comma seperated integers each greater than zero.`;

    } else {
      //param value is valid, display dialog
      displayDeletionConfirmationDialog = true;

      //deleteId parameter consists only of positive integers according to regexpr test, create array of integers from string 
      const bookIdsStrValues = deleteBookIdParamVal.split(",");
      bookIdsStrValues.forEach((bookIdStrVal) => {
        deletableBooksIdsArr.push(parseInt(bookIdStrVal));
      })
    }
  }


  return (
    <>
      {errorMessage &&
        <GeneralErrorMessage msgText={errorMessage} />
      }

      {displayDeletionConfirmationDialog &&
        <BookDeletionProcessorForBooksListPage
        deletableBooksIds={deletableBooksIdsArr}
        allBooksDisplayedInList={allBooksDisplayedInList}
        booksListPageUrl={currentBookListUrl} />
     }
    </>
  )
}
