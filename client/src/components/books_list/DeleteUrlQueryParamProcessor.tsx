
import { useSearchParams } from "react-router-dom";
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
 * @param listBaseUrl - list base URL to which page will be redirected to after deletion is confirmed or canceled 
 * @param allBooksDisplayedInList - all books passed as books list to parent component that creates list HTML markup, will be passed
 * to component performing the deletion
 * @param currentFilterString - 
 */

type UrlDeleteQueryParamProcessorProps = {
  listBaseUrl: string,
  allBooksDisplayedInList: Book[] | undefined,
}

export function DeleteUrlQueryParamProcessor({ 
  listBaseUrl,
  allBooksDisplayedInList }: UrlDeleteQueryParamProcessorProps) {

  const [searchParams] = useSearchParams()

  //
  //process book deletion get parameter in url 
  //
  const deletableBooksIdsArr: number[] = [];
  const deleteBookIdParamVal = searchParams.get("deleteId");
  //used for showing error messages
  let errorMessage;
  let displayDeletionConfirmationDialog = false;


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
        booksListPageUrl={listBaseUrl} />
     }
    </>
  )
}
