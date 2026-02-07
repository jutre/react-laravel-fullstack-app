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
import { getBookListBaseUrl } from '../../utils/utils.ts';
import { Book } from '../../types/Book.ts';
import { useAppSelector } from "../../store/reduxHooks.ts";
import { selectBookDeletingEndpointLoadingStatus } from "../../features/booksSlice.ts";
import { STATUS_PENDING } from '../../constants/asyncThunkExecutionStatus.ts'
import { BooksListModeParams, BooksListModes } from '../../types/BooksListMode.ts';

type BooksListTableProps = {
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
  currentSearchString?: string,
  removeFromFavoritesCallback?: (bookId: number) => void
}

/**
 * Creates complete books list HTML markup. Receives most of data as properties from parent component and displays received loading/error
 * states, fetched data following each parent re-render while it performs data fetching from REST API.
 * Also receives customized text labels and markup corresponding to specific type of books list which lets reuse this component to display
 * books list of various types as the label displayed when e.g. all books or favorites list is empty are slightly different.
 * Also contains component invoking book deletion component in response to URL query parameter change.
 * 
 * @param listMode - determines primary type of data that component will display. If value is undefined than all or filtered books list
 * is displayed (filtered list is displayed if URL search query parameter is set); if value is equals to "FAVORITE_BOOKS_LIST" then favorite
 * books list is displayed.
 * @param listItems - list of books to display
 * @param isFetchingData - whether data is being fetched, used to display loading state in UI
 * @param isRemovingFromFavorites - whether book is being removed from favorites, used to display loading state in UI
 * @param errorMessage - error message from REST API backend or other e.g. that search string is too short
 * @param listHeader - heading tag content for whole list, indicates list type
 * @param messageWhenBooksListIsEmpty - string or HTML markup that displays message that that list is empty, may be different for different
 * list type. Displayed only when list is empty
 * @param searchedStringAndResultInfoMessage - string or HTML markup that displays info about found books count, may contains link to all
 * books list
 * @param currentSearchString - currently entered search string, for correct link creation
 * @param removeFromFavoritesCallback - function from parent component that is called when user clicks "Remove from favorites icon"
 */

export function BooksListBody({
  listMode,
  listItems,
  isFetchingData,
  isRemovingFromFavorites,
  errorMessage,
  listHeader,
  messageWhenBooksListIsEmpty,
  searchedStringAndResultInfoMessage,
  currentSearchString,
  removeFromFavoritesCallback }: BooksListTableProps & BooksListModeParams) {

  function getBookEditUrl(bookId: number, listMode: BooksListModes) {
    //replace bookId segment in book edit route pattern
    let editUrl = routes.bookEditPath.replace(":bookId", String(bookId));
    //if current list is other than all books list, add parameter which contains url to which list to return
    //to construct "Back to list" link and redirect url the page is redirected after book is deleted in
    //edit screen
    if (listMode) {
      editUrl += "?parentListUrl=" + getBookListBaseUrl(listMode);
    }

    return editUrl;
  }

  /**
   * creates deleting url by adding deleteId parameter to needed book list (all books list of favourites list) url. 
   * Adds "search" get param if currently displayed list is search result list.
   * "search" param is added to keep displaying search results list after a selected book is deleted.
   * Intended to use for a book list item to create delete url for a single book.
   * @param {int} bookId  - 
   * @param {string} searchGetParamVal 
   * @returns 
   */
  function getBookDeletionUrl(bookId: number, searchGetParamVal: string | undefined, listMode: BooksListModes) {

    let deleteUrl = getBookListBaseUrl(listMode);
    deleteUrl += "?deleteId=" + bookId;

    if (searchGetParamVal) {
      deleteUrl += "&search=" + searchGetParamVal;
    }
    return deleteUrl;
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
        listMode={listMode}
        allBooksDisplayedInList={listItems}
        currentFilterString={currentSearchString} />


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
            searchGetParamVal={currentSearchString}
            baseUrl={getBookListBaseUrl(listMode)} />}

          {(listItems).map(book =>
            <BookListItem
              key={book.id}
              book={book}
              editUrl={getBookEditUrl(book.id, listMode)}
              deleteUrl={getBookDeletionUrl(book.id, currentSearchString, listMode /*todo move currentSearchString as last optional param*/)}
              removeFromFavoritesButtonClickHandler={removeFromFavoritesCallback} />
          )}
        </fieldset>
      }
    </div>
  )
}
