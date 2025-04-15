import { useState, useEffect } from 'react';
import { routes } from "../../config";
import { Link } from "react-router-dom";
import BooksListItemsSelectionBar from "./BooksListItemsSelectionBar"
import { BookListItem } from "./BooksListItem";
import { FAVORITE_BOOKS_LIST } from "../../constants/bookListModes";
import { NavLinkBack } from "../ui_elements/NavLinkBack";
import { DataFetchingStatusLabel } from '../ui_elements/DataFetchingStatusLabel';
import { GeneralErrorMessage } from "../ui_elements/GeneralErrorMessage";
import { selectSearchString, selectBookDeletingEndpointLoadingStatus } from "../../features/booksSlice";
import { STATUS_PENDING } from'../../constants/asyncThunkExecutionStatus.ts'
import { useGetBooksListQuery,
  useGetFilteredBooksListQuery,
  useGetFavoriteBooksIdentifiersQuery,
  useAddBookToFavoritesMutation,
  useRemoveBookFromFavoritesMutation,
  useGetFavoriteBooksQuery } from '../../features/api/apiSlice';
import { extractMessageFromQueryErrorObj,
  findNonEmptyErrorFromList,
  getBookListBaseUrl } from '../../utils/utils';
import { useAppSelector } from "../../store/reduxHooks";
import { Book } from '../../types/Book';
import { BooksListModeParams, BooksListModes } from '../../types/BooksListMode'
import { skipToken } from '@reduxjs/toolkit/query/react'


/**
 * Displays all books list or favorite books list depending on listMode prop value. Mode displaying all books list lets activate filtered
 * books list mode if page URL query param containing filtering string is present. All three modes have common functionality of list items
 * output (link to book editing, deleting, adding/removing from favorites list). Distinct API endpoints are used for each mode, different
 * messages in case list is empty, messages about used filtering string (current string, too short string message)
 * 
 * @param listMode - determines type of data that will be displayed. If parameter is undefined than all books list or filtered list if
 * query param is present in page URL, if dedicted value is suplied then displays favorite books.
 */

export function BooksListBody({ listMode }: BooksListModeParams) {

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
  function getBookDeletionUrl(bookId: number, searchGetParamVal: string | null, listMode: BooksListModes) {

    let deleteUrl = getBookListBaseUrl(listMode);
    deleteUrl += "?deleteId=" + bookId;

    if (searchGetParamVal) {
      deleteUrl += "&search=" + searchGetParamVal;
    }
    return deleteUrl;
  }


  /* if current component is being rendered for first time (f.e. user navigated from book editing page to book list page or entered book 
    list URL possibly with 'search' query param), it's sibling BooksListParamProcessor has also been rendered for first time, the 
    useEffect() hook in BooksListParamProcessor, which sets search string from 'search' query param, has not been ran yet and and it is not
    known whether 'search' query param is present. Therefore, for first rendering time current component will not return any output, will 
    not run queries, just will set wasRenderedForFirstTime state variable to true after first render. At next render the possible 'search'
    param value will be available and component will fetch and display either books list or search list*/
  const [wasRenderedForFirstTime, setWasRenderedForFirstTime] = useState(false);

  useEffect(() => {
    setWasRenderedForFirstTime(true)
  }, []);


  //book deleting endpoint is invoked in other component, getting it's execution status
  let bookDeletingEndpointLoadingStatus = useAppSelector(state => selectBookDeletingEndpointLoadingStatus(state));

  //create url for returning to unfiltered list link that will be shown when search string is filtered by search string
  let allBooksListUrl = routes.bookListPath;

  //current search string is obtained from state (is being set to state in BooksListParamsProcessor). Convert null value to empty string
  //to be able to conveniently call string functions (length, trim()) and to build condition that satisfies Typescript when passing to 
  //RTK Query parameter (seach string or skip token)
  let currentSearchString = useAppSelector(state => selectSearchString(state));
  if (currentSearchString === null) {
    currentSearchString = ""
  }

  //use trimmed version of search string, suitable to check length after trimming anywhere in further code
  currentSearchString = currentSearchString.trim()

  //after first render search string is available in Redux store (see comments on useEffect that sets setWasRenderedForFirstTime(true)).
  //Now it's possible to figure out the type of current list to display, and which endpoint should be executed
  let currentlyDisplayedList: BooksListMode | null = null
  let executableEndpoint: ExecutableEndpoint = null

  if (wasRenderedForFirstTime) {
    currentlyDisplayedList = getCurrentListMode(listMode, currentSearchString)
    executableEndpoint = getExecutableEndpoint(currentlyDisplayedList, currentSearchString)
  }


  const { data: booksListQueryData = [],
    error: booksListQueryError,
    isFetching: isFetchingBooksList } =
    useGetBooksListQuery(executableEndpoint !== 'all_books_query' ? skipToken : undefined);

  const { data: booksFilteringQueryData,
    error: booksFilteringQueryError,
    isFetching: isFetchingBooksFiltering } =
    useGetFilteredBooksListQuery(executableEndpoint !== 'filtered_list_query'
      ? skipToken
      : {filterString: currentSearchString});

  const { data: favoriteBooksQueryData = [],
    error: favoriteBooksQueryError,
    isFetching: isFetchingFavoriteBooks } =
    useGetFavoriteBooksQuery(executableEndpoint !== 'favorites_list_query' ? skipToken : undefined)

  //favorite books identifiers list fetching endpoints loading, fetching states and returned error are used in current component along with
  //other endpoints' similar variables but returned data is accessed single book item component using selector 
  const { error: favoriteBooksIdentifiersQueryError,
    isFetching: isFetchingFavoriteBooksIdentifiers,
    isLoading: isLoadingFavoriteBooksIdentifiers } =
    useGetFavoriteBooksIdentifiersQuery()


  //loading state, error variables returned by mutations adding and removing book from favorites will be displayed on top of books list
  //where same purpose variables from book list, favorite books fetching queries are displayed. Mutation trigger will be passed to child
  //book list item components
  const [triggerAddToFavoritesMutation, {
    error: addToFavoritesError,
    isLoading: isAddingToFavorites }] = useAddBookToFavoritesMutation()

  const [triggerRemoveFromFavoritesMutation, {
    error: removeFromFavoritesError,
    isLoading: isRemovingFromFavorites }] = useRemoveBookFromFavoritesMutation()


  //on first render not displaying anything (see wasRenderedForFirstTime state variable description)
  if (!wasRenderedForFirstTime) {
    return null;
  }

  //assign to common variable that is used in loop that creates the actual list HTML markup data from executed endpoint according to
  //presentation mode
  let booksToDisplay: Book[] = [];
  if (currentlyDisplayedList === 'favorites_list') {
    booksToDisplay = favoriteBooksQueryData
  }else if (currentlyDisplayedList === 'filtered_list') {
    booksToDisplay = booksFilteringQueryData ? booksFilteringQueryData.data : []
  } else {
    booksToDisplay = booksListQueryData
  }

  //There are cases when already fetched books data must not be displayed in books list. In those cases assign books list containing
  //variable empty array:
  //1)while favorite books identifiers endpoint is loading (fetching data for very first time), 2) on favorite books identifiers fetching
  //endpoint error. In those cases books list must not be displayed as it is not known which books are to be displayed as favorite books
  if (isLoadingFavoriteBooksIdentifiers || favoriteBooksIdentifiersQueryError) {
    booksToDisplay = []

  //if non empty search string is too short, make currently displayable books variable empty as there may be returned non empty result
  //from previous filtering endpoint invocation, it is still assigned to booksFilteringQueryData result variable as endpoint result is
  //not reset any way
  }else if (currentlyDisplayedList === 'filtered_list' && currentSearchString.length < 3) {
    booksToDisplay = []
  }

  let searchStrTooShortErrorMessage: string | undefined;

  //if search string is not empty but shorter than three symbols, assigne error message
  if (currentlyDisplayedList === 'filtered_list' && currentSearchString.length < 3) {
    searchStrTooShortErrorMessage = "Searching string must contain at least three symbols"

  }

  //capture error from any endpoint in variable for later output
  let errorMsgFromAnyEndpoint: string | undefined;
  let currentErrorFromEndpoint = findNonEmptyErrorFromList(booksListQueryError, 
    booksFilteringQueryError,
    favoriteBooksIdentifiersQueryError,
    favoriteBooksQueryError,
    addToFavoritesError,
    removeFromFavoritesError)

  if (currentErrorFromEndpoint) {
    errorMsgFromAnyEndpoint = extractMessageFromQueryErrorObj(currentErrorFromEndpoint)
  }


  /**
   * various messages on empty lists, info about filtering results, entered search phrase
   */

  let searchResultsInfoMessage: string | undefined;
  if (currentlyDisplayedList === 'filtered_list') {
    searchResultsInfoMessage = `Your searched for "${currentSearchString}".`;
  }

  //if books to display array is empty and fetching is done, without fetching errors display message that list is empty
  let showEmptyFavoritesListMessage = false;
  let showEmptyListMessage = false;

  //capture fetching progress  while all books or filtered books list or favorite books list are being fetched, adding/removing from
  //favorites mutations are executed
  let currentlyFetching = isFetchingBooksList || isFetchingBooksFiltering || isFetchingFavoriteBooksIdentifiers || isFetchingFavoriteBooks
    || isAddingToFavorites || isRemovingFromFavorites

  //one of conditions to create message about empty all books, filtered, favorites books list or found books count is absence of
  //fetching errors from corresponding endpoint or filter string too short error. Create a single variable that is assigned a non undefined
  //value if any of error is defined
  const hasAnyFetchingOrSearchStrLengthError =
    booksListQueryError || booksFilteringQueryError || favoriteBooksIdentifiersQueryError || favoriteBooksQueryError
    || searchStrTooShortErrorMessage

  //if fetching process is done and book list is empty a message about this fact will be shown if there are no fetching or search string  
  //length error. Custom message depending on list type 
  if (booksToDisplay.length === 0 && !currentlyFetching && !hasAnyFetchingOrSearchStrLengthError) {

    if (currentlyDisplayedList === 'filtered_list') {
      searchResultsInfoMessage += " No books were found."
    } else if (listMode === FAVORITE_BOOKS_LIST) {
      showEmptyFavoritesListMessage = true;
    } else {
      //books list mode, display message that there are no books added yet
      showEmptyListMessage = true;
    }
  }

  //if fetching process is done, there are no fetching errors, no search string length error and search result is not empty, create
  //info message about number of found books
  if (currentlyDisplayedList === 'filtered_list' &&
    booksToDisplay.length > 0 &&
    !(currentlyFetching || hasAnyFetchingOrSearchStrLengthError)) {

    searchResultsInfoMessage += ` Number of records found is ${booksToDisplay.length}.`;
  }

  //while some action is pending (adding to favorites, deleting, loading list after deleting, adding/removing from favorites)
  //all buttons next to each book (editing, deleting, adding/removing from favorites) must be disabled
  let disableListButtons = currentlyFetching || bookDeletingEndpointLoadingStatus === STATUS_PENDING

  return (
    <>
      <div>
        {//loading indicator
        (currentlyFetching) &&
          <DataFetchingStatusLabel labelText="loading..." />
        }

        {//filtered_list mode. Display link to all book, entered search string, error message about too short search string
        currentlyDisplayedList === 'filtered_list' &&
        <>
          <div>
            <NavLinkBack url={allBooksListUrl} 
              linkLabelOverrideText='Display all records'/> 
          </div>
          <div className="mb-[15px]">
            {searchResultsInfoMessage}
          </div>
          {//dispay error if search string too short
            searchStrTooShortErrorMessage &&
            <GeneralErrorMessage msgText={searchStrTooShortErrorMessage} />
          }
        </>
        }


        {errorMsgFromAnyEndpoint &&
          <GeneralErrorMessage msgText={errorMsgFromAnyEndpoint} />
        }


        {showEmptyFavoritesListMessage &&
          <div>There are no books added to favorite books list.</div>
        }


        {//if books array is empty and no searching is done (it might be the case nothing is found), offer adding some books 
          (showEmptyListMessage) &&
          <p><strong>Books list is empty.</strong> <br/><br/>
           Books can be added manually using form on <Link to={routes.createBookPath}>"Add book"</Link> page
           or created automatically on <Link to={routes.demoDataResetPath}>"Demo data reset"</Link> page. "Demo data reset" page lets create
           demo data with ten book records.
          </p>
        }


        {booksToDisplay.length > 0 &&
          //using <fieldset> to make all child button elements disabled by adding disabled attribute
          <fieldset disabled={disableListButtons}
            className={'relative after:absolute disabled:after:inset-0 disabled:after:bg-[gray] disabled:after:opacity-30 ' +
            'disabled:opacity-50 disabled:after:rounded-[8px] disabled:after:z-[2000]'} >
            {<BooksListItemsSelectionBar
              allDisplayedBooks={booksToDisplay}
              searchGetParamVal={currentSearchString}
              baseUrl={getBookListBaseUrl(listMode)} />}

            {(booksToDisplay).map(book =>
              <BookListItem key={book.id}
                book={book}
                editUrl={getBookEditUrl(book.id, listMode)}
                deleteUrl={getBookDeletionUrl(book.id, currentSearchString, listMode)}
                addToFavoritesQueryTrigger={triggerAddToFavoritesMutation}
                removeFromFavoritesQueryTrigger={triggerRemoveFromFavoritesMutation} />
            )}
          </fieldset>
        }
      </div>
    </>
  )
}


type BooksListMode = 'all_books_list' | 'filtered_list' | 'favorites_list'

/**
 * Depending on 'listMode' component property's value and search query parameter presence list can display all books list, filtered books 
 * list of favorite books list. Default is all books list
 * 
 * Returns string that specifies data mode that component must work in (all books list, filtered list of favorites list). If 'listMode'
 * parameter is undefined and empty search string parameter than all books list mode is returned, if search string is not empty then 
 * filtered list mode returned; If 'listMode' equals to "FAVORITE_BOOKS_LIST" string then favorite list mode is returned
 * 
 * @param listMode
 * @param currentSearchString
 * @returns
 */
export function getCurrentListMode(listMode: BooksListModes, currentSearchString: string | null): BooksListMode {
  //if 'listMode' property is set to favorite books list, component will display favorite books, ignore search query param in such case as
  //filtering functionality is not present in favorite books list
  if(listMode === FAVORITE_BOOKS_LIST){
    return 'favorites_list'

  }else if (currentSearchString) {
    return 'filtered_list'

  //no search string then all books list
  }else{
    return 'all_books_list'
  }
}

type ExecutableEndpoint = 'all_books_query' | 'filtered_list_query' | 'favorites_list_query' | null;

/**
 * Returns string which determines which endpoint should be executed depending on list mode and whether or not it should be executed.
 * Distinct case is filtered_list mode as in this mode in case of search string being too short endpoint must not be executed, null is
 * returned in such case. In othercases a dedicated endpoint must be executed, an endpoint determing string is returned
 * 
 * @param currentListMode
 * @param currentSearchString
 * @returns
 */
export function getExecutableEndpoint(currentListMode: BooksListMode, currentSearchString: string | null): ExecutableEndpoint {
  if (currentListMode === 'favorites_list') {
    return 'favorites_list_query'

  }else if (currentListMode === 'filtered_list') {
    //execute books filtering endpoint only if search string length is at least three symbols
    if (currentSearchString !== null && currentSearchString.length >= 3) {
      return 'filtered_list_query'

    }else{
      return null;
    }

    //search string is not set, execute books list query
  } else {
    return 'all_books_query'
  }
}

