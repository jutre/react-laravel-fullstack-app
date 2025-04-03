import { useState, useEffect } from 'react';
import { routes } from "../../config";
import { Link, NavLink } from "react-router-dom";
import BooksListItemsSelectionBar from "./BooksListItemsSelectionBar"
import { BookListItem } from "./BooksListItem";
import { FAVORITE_BOOKS_LIST } from "../../constants/bookListModes";
import { DataFetchingStatusLabel } from '../ui_elements/DataFetchingStatusLabel';
import { GeneralErrorMessage } from "../ui_elements/GeneralErrorMessage";
import { selectSearchString } from "../../features/booksSlice";
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
 * Displays book list, filtered books list or favorite books list displaying items with links to book editing, deleting, adding/removing
 * from favorites list.
 * 
 * @param {string} listMode - current list mode - all books or favarite books. Used to create params for fetching corresponding list from 
 * backend (all or favorite books), used to calculate URL for deleting, editing operations which includes also information URL to get back
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

  //depending on 'listMode' component property's value and search query parameter presence list can display all books list, filtered books
  //list of favorite books list
  let currentlyDisplayedList: 'all_books_list' | 'filtered_list' | 'favorites_list' | null = null;

  let searchStrTooShortErrorMessage: string | undefined;

  //defaults to skip book list, favorite books list and book filtering query executing until it is known whether which of them should be
  //displayed
  let skipFavoriteBooksQueryExecuting = true
  let skipBooksListQueryExecuting = true
  let skipBooksFilteringQueryExecuting = true

  //after first render possible search string is available. Figure out 1)type of current list to display, 2) which query should be executed
  if (wasRenderedForFirstTime) {

    //if 'listMode' property is set to favorite books list, component will display favorite books, ignore search query param in such case as
    //filtering functionality is not present in favorite books list
    if(listMode === FAVORITE_BOOKS_LIST){
      currentlyDisplayedList = 'favorites_list'

    }else{

      //if 'listMode' property is not set to favorite books list, component will display filtered books list if filter string is not empty,
      //all books list if search string is empty; if search
      if (currentSearchString) {
        currentlyDisplayedList = 'filtered_list'
      }else{
        currentlyDisplayedList = 'all_books_list'
      }
    }

    if (currentlyDisplayedList === 'favorites_list') {
      skipFavoriteBooksQueryExecuting = false

    }else if (currentlyDisplayedList === 'filtered_list') {

      //execute books filtering endpoint only if search string length is at least three symbols
      if (currentSearchString.length >= 3) {
        skipBooksFilteringQueryExecuting = false
      }

      //search string is not set, execute books list query, data from it is used when displaying all books list and also favorites list
    } else {
      skipBooksListQueryExecuting = false
    }
  }


  const { data: booksListQueryData = [],
    error: booksListQueryError,
    isFetching: isFetchingBooksList } =
    useGetBooksListQuery(skipBooksListQueryExecuting ? skipToken : undefined);

  const { data: booksFilteringQueryData = [],
    error: booksFilteringQueryError,
    isFetching: isFetchingBooksFiltering } =
    useGetFilteredBooksListQuery(skipBooksFilteringQueryExecuting ? skipToken : currentSearchString);

  //favorite books list fetching endpoint is launched in this component, endpoint's loading, fetching states and returned error are
  //displayed in current component, but returned data is used in component displaying single book item
  const { error: favoriteBooksIdentifiersQueryError,
    isFetching: isFetchingFavoriteBooksIdentifiers,
    isLoading: isLoadingFavoriteBooksIdentifiers } =
    useGetFavoriteBooksIdentifiersQuery()

    const {  data: favoriteBooksQueryData = [],
      error: favoriteBooksQueryError,
      isFetching: isFetchingFavoriteBooks,
      isLoading: isLoadingFavoriteBooks } =
      useGetFavoriteBooksQuery(skipFavoriteBooksQueryExecuting ? skipToken : undefined)



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

  //assigning data from executed endpoint (books list or filtering endpoint) to variable that will output do create actual list in markup
  let booksToDisplay: Book[] = [];
  if (currentlyDisplayedList === 'favorites_list') {
    booksToDisplay = favoriteBooksQueryData
  }else if (currentlyDisplayedList === 'filtered_list') {
    booksToDisplay = booksFilteringQueryData
  } else {
    booksToDisplay = booksListQueryData
  }

  //There are cases when already fetched books data must not be displayed in books list. In those cases assign books list containing
  //variable empty array:
  //1)while favorite books endpoint is loading (fetching data for very first time), 2) on favorite books fetching endpoint error. In those
  //cases books list must not be displayed as it is not known which books are to be displayed as favorite books
  if (isLoadingFavoriteBooksIdentifiers || isLoadingFavoriteBooks || favoriteBooksIdentifiersQueryError || favoriteBooksQueryError) {
    booksToDisplay = []

  //if non empty search string is too short, make currently displayable books variable empty as there may be returned non empty result
  //from previous filtering endpoint invocation, it is still assigned to booksFilteringQueryData result variable as endpoint result is
  //not reset any way
  }else if (currentlyDisplayedList === 'filtered_list' && currentSearchString.length < 3) {
    booksToDisplay = []
  }


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
  let showEmptyFavoritesListMessage;
  let showEmptyListMessage;

  //capture fetching progress  while all books or filtered books list or favorite books list are being fetched, adding/removing from
  //favorites mutations are executed
  let currentlyFetching = isFetchingBooksList || isFetchingBooksFiltering || isFetchingFavoriteBooksIdentifiers || isFetchingFavoriteBooks
    || isAddingToFavorites || isRemovingFromFavorites

  //when creating messages about empty books list, favorites list, filtered books list only care about if there any data fetching errors
  //obtaining books list, filtered list, favorites list, filter string too short error. Only in case of absence of those errors a message
  //about empty books/favorites/filtering list will be created. On presence of any of mentioned errors, error message will be snown instead
  const hasAnyFetchingOrSearchStrLengthError =
    booksListQueryError || booksFilteringQueryError || favoriteBooksIdentifiersQueryError || favoriteBooksQueryError
    || searchStrTooShortErrorMessage

  //if fetching process is done and book list is empty a message about this fact will be shown if there are no fetching or search string  
  //length error. Custom message depending on list type 
  if (booksToDisplay.length === 0 && !currentlyFetching && !hasAnyFetchingOrSearchStrLengthError) {

    if (currentlyDisplayedList === 'filtered_list') {
      searchResultsInfoMessage += " Nothing was found."
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


  return (
    <>
      <div>
        {errorMsgFromAnyEndpoint &&
          <GeneralErrorMessage msgText={errorMsgFromAnyEndpoint} />
        }

        {//dispay error if search string too short
          searchStrTooShortErrorMessage &&
          <GeneralErrorMessage msgText={searchStrTooShortErrorMessage} />
        }
        {//when searching was done, always display entered search phrase, link to all records
          searchResultsInfoMessage &&
          <>
            <div className="py-[15px]">
              {searchResultsInfoMessage}
            </div>
            <div className="py-[15px]">
              <NavLink className={() => "underline font-bold"}
                to={allBooksListUrl}>Display all records</NavLink>
            </div>
          </>
        }



        {showEmptyFavoritesListMessage &&
          <div>There are no books added to favorite books list.</div>
        }
        {//if books array is empty and no searching is done (it might be the case nothing is found), offer adding some books 
          (showEmptyListMessage) &&
          <p>There are no books added yet. Add them by
            using <Link to={routes.createBookPath}>"Add book"</Link> link!
          </p>
        }


        {(currentlyFetching) &&
          <DataFetchingStatusLabel labelText="loading..." />
        }

        {booksToDisplay.length > 0 &&
          <>
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
          </>
        }
      </div>
    </>
  )


}
