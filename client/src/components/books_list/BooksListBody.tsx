import { useEffect } from 'react';
import { routes } from "../../config";
import { DeleteUrlQueryParamProcessor } from "./DeleteUrlQueryParamProcessor";
import BooksListItemsSelectionBar from "./BooksListItemsSelectionBar"
import { H1Heading } from "../ui_elements/H1Heading";
import { CreateBookButton } from '../ui_elements/CreateBookButton.tsx';
import { setPageTitleTagValue } from '../../utils/setPageTitleTagValue';
import { BookListItem } from "./BooksListItem";
import { BooksListLoadingSketeton } from './BooksListLoadingSketeton';
import { GeneralErrorMessage } from "../ui_elements/GeneralErrorMessage";
import { DataFetchingStatusLabel } from '../ui_elements/DataFetchingStatusLabel';
import { Book } from '../../types/Book.ts';
import { useAppSelector } from "../../store/reduxHooks.ts";
import { selectBookDeletingEndpointLoadingStatus } from "../../features/booksSlice.ts";
import { STATUS_PENDING } from '../../constants/asyncThunkExecutionStatus.ts'

type BooksListTableProps = {
  listBaseUrl: string,
  // get also undefined value for 'listItems' property value type to get actual 'data' object property originating from RTK Query hook
  // returned object while fetching is in progress instead of using default empty array value. This lets to do additional checks when needed
  // in current component's child components
  listItems: Book[] | undefined,
  isFetchingData: boolean,
  isRemovingFromFavorites?: boolean,
  errorMessage?: string,
  listHeader: string,
  searchedStringAndResultInfoMessage?: React.ReactNode,
  messageWhenBooksListIsEmpty?: React.ReactNode,
  removeFromFavoritesCallback?: (bookId: number) => void
}

/**
 * Creates complete books list HTML markup. Receives most of data as properties from parent component and displays received loading/error
 * states, fetched data following each parent re-render while it performs data fetching from REST API.
 * Also receives customized text labels and markup corresponding to specific type of books list which lets reuse this component to display
 * books list of various types as the label displayed when e.g. all books or favorites list is empty are slightly different.
 * Also contains component invoking book deletion component in response to URL query parameter change.
 * 
 * @param listBaseUrl - the basic URL that list is displayed on. May contain also query parameters, e.g "/search/?q=foo". This URL is
 * used to construct other URLs like by adding query parameters or creating back to list URL in book edit page links
 * @param listItems - list of books to display
 * @param isFetchingData - whether data is being fetched, used to display loading state in UI
 * @param isRemovingFromFavorites - whether book is being removed from favorites, used to display loading state in UI
 * @param errorMessage - error message from REST API backend or other e.g. that search string is too short
 * @param listHeader - heading tag content for whole list, indicates list type
 * @param messageWhenBooksListIsEmpty - string or HTML markup that displays message that that list is empty, may be different for different
 * list type. Displayed only when list is empty
 * @param searchedStringAndResultInfoMessage - string or HTML markup that displays info about found books count, may contains link to all
 * books list
 * @param removeFromFavoritesCallback - function from parent component that is called when user clicks "Remove from favorites icon"
 */

export function BooksListBody({
  listBaseUrl,
  listItems,
  isFetchingData,
  isRemovingFromFavorites,
  errorMessage,
  listHeader,
  messageWhenBooksListIsEmpty,
  searchedStringAndResultInfoMessage,
  removeFromFavoritesCallback }: BooksListTableProps) {

  function getBookEditUrl(bookId: number, listBaseUrl: string) {
    //replace bookId segment in book edit route pattern
    let editUrl = routes.bookEditPath.replace(":bookId", String(bookId));
    //parameter which contains URL to list to return to when user click "Back to list" link or is redirected after book is deleted
    //in book edit screen
    editUrl += "?parentListUrl=" + encodeURIComponent(listBaseUrl)

    return editUrl;
  }

  /**
   * creates deleting url by adding deleteId parameter to needed book list (all books list of favourites list) url. 
   * Adds "search" get param if currently displayed list is search result list.
   * "search" param is added to keep displaying search results list after a selected book is deleted.
   * Intended to use for a book list item to create delete url for a single book.
   * @param bookId
   * @param listBaseUrl
   * @returns 
   */
  function getBookDeletionUrl(bookId: number, listBaseUrl: string) {
    return listBaseUrl + getDeviderForNextUrlQueryStringParam(listBaseUrl) + "deleteId=" + bookId
  }

  useEffect(() => {
    setPageTitleTagValue(listHeader);
  }, [])

  //book deleting endpoint is invoked in URL query params processing component. Here endpoints execution status is obtained from Redux store
  const bookDeletingEndpointLoadingStatus = useAppSelector(state => selectBookDeletingEndpointLoadingStatus(state));
  const isDeletingBook = bookDeletingEndpointLoadingStatus === STATUS_PENDING


  //while mutation endpoints (deleting, removing from favorites) are pending all action buttons next to each book in list and batch
  //selection control must be inactive while still showing the list
  const areListButtonsDisabled = isRemovingFromFavorites || isDeletingBook


  return (
    <div className="relative">

      <H1Heading headingText={listHeader} />


      {/*button redirecting to book creating page on top right corner on all types of books list*/}
      <CreateBookButton />


      {/*outputs markup of modal of deletion confirmation dialog, deleting progress indicator or error message*/}
      <DeleteUrlQueryParamProcessor
        listBaseUrl={listBaseUrl}
        allBooksDisplayedInList={listItems} />


      { //always output search info message. Parent node may assign this property a non empty value of leave null or undefined
        //depending on required logic (display current search string, number of found books, info about no found books).
        //Also may be used in counjunction with messageWhenBooksListIsEmpty property
        searchedStringAndResultInfoMessage}


      { //place error message under search results info message to possibly output 'search string too short' message in case error message
        //already is not added to results info message variable. Placing error before books list output code because in case there is error
        //from endpoint that removes book from favorites the error must appear before books list that is still visible
        errorMessage &&
        <GeneralErrorMessage msgText={errorMessage} />
      }


      { //output variable containing message about empty list only when list items array is empty, fetching is not performed and
        //there are no any errors
        (listItems &&
          listItems.length === 0 &&
          isFetchingData === false &&
          errorMessage === undefined) &&

        <>{messageWhenBooksListIsEmpty}</>
      }


      {isRemovingFromFavorites &&
        <DataFetchingStatusLabel labelText="removing from favorites..." />
      }


      {isFetchingData === true
        ?
        //show skeleton when fetching data
        <BooksListLoadingSketeton />

        :
        //output list items and items selection bar if list is not empty and data fetching is finished (on empty list the message on empty
        //books list it output instead)
        (listItems && listItems.length > 0) &&
        //using <fieldset> as parent element to make all contained child button elements disabled by adding "disabled" attribute.
        //Additionally visually gray out the list and make grey background transparency changing using animation
        <fieldset disabled={areListButtonsDisabled}
          //part of classes to gray out <fieldset> children while it is disabled
          className="relative disabled:opacity-50">

          {//display <div> that has changing intensity gray background when list is disabled over parent <fieldset>
            areListButtonsDisabled &&
            <div className="absolute inset-0 bg-[gray] opacity-30 disabled:opacity-50 rounded-[8px] animate-pulse z-[2000]"></div>}

          {<BooksListItemsSelectionBar
            allDisplayedBooks={listItems}
            baseUrl={listBaseUrl} />}

          {(listItems).map(book =>
            <BookListItem
              key={book.id}
              book={book}
              editUrl={getBookEditUrl(book.id, listBaseUrl)}
              deleteUrl={getBookDeletionUrl(book.id, listBaseUrl)}
              removeFromFavoritesButtonClickHandler={removeFromFavoritesCallback} />
          )}
        </fieldset>
      }
    </div>
  )
}


/**
 * returns a devider that should be used to to URL string to add a new query string parameter to passed URL.
 * If URL already has a query string, then devider will be ampersand, if no then question mark
 * @param baseUrl - an URL to which a parameter must be calc
 * @returns 
 */
export function getDeviderForNextUrlQueryStringParam(baseUrl: string) {

  if (baseUrl.includes("?")) {
    return "&"
  } else {
    return "?"
  }
}
