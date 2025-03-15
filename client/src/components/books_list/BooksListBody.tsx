import { useState, useEffect } from 'react';
import { routes } from "../../config";
import { Link, NavLink } from "react-router-dom";
import BooksListItemsSelectionBar from "./BooksListItemsSelectionBar"
import { BookListItem } from "./BooksListItem";
import { FAVORITE_BOOKS_LIST } from "../../constants/bookListModes";
import { GeneralErrorMessage } from "../ui_elements/GeneralErrorMessage";
import { selectSearchString } from "../../features/booksSlice";
import { useGetBooksListQuery, useGetFilteredBooksListQuery } from '../../features/api/apiSlice';
import { extractMessageFromQueryErrorObj, getBookListBaseUrl } from '../../utils/utils';
import { useAppSelector } from "../../store/reduxHooks";
import { Book } from '../../types/Book';
import { skipToken } from '@reduxjs/toolkit/query/react'

type BooksListBodyParams = { listMode?: string }
/**
 * This component displays book list from store. It might display all books or 
 * filtered list is search string is set in filters state
 * 
 * @param {string} listMode - current list mode (all books of favarites), used to calculate urls for deleting, editing operations
 * to get back to list user came from before choosing deleting or editing url
 */

export function BooksListBody({ listMode }: BooksListBodyParams) {

  function getBookEditUrl(bookId: number, listMode: string | undefined) {
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
  function getBookDeletionUrl(bookId: number, searchGetParamVal: string | null, listMode: string | undefined) {

    let deleteUrl = getBookListBaseUrl(listMode);
    deleteUrl += "?deleteId=" + bookId;

    if (searchGetParamVal) {
      deleteUrl += "&search=" + searchGetParamVal;
    }
    return deleteUrl;
  }

  const [wasRenderedForFirstTime, setWasRenderedForFirstTime] = useState(false);

  /* if current component is being rendered for first time (f.e. user navigated from book editing page to book list page or entered book 
    list URL possibly with 'search' query param), it's sibling BooksListParamProcessor has also been rendered for first time, the 
    useEffect() hook in BooksListParamProcessor, which sets search string from 'search' query param, has not been ran yet and and it is not
    known whether 'search' query param is present. Therefore, for first rendering time current component will not return any output, will 
    not run queries, just will set wasRenderedForFirstTime state variable to true after first render. At next render the possible 'search'
    param value will be available and component will fetch and display either books list or search list*/
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


  //defaults to skip book list and book filtering query executing until it is known whether a books list
  //or search book list should be displayed
  let booksListQueryExecSkippingConfig = { skip: true }
  let skipBooksFilteringQueryExecuting = true

  //add info how much records were found during search
  let searchResultsInfoMessage;
  let searchStrTooShortErrorMessage;

  //on first render will not perform any queries, so not analysing which query snould be enabled
  if (wasRenderedForFirstTime) {
    currentSearchString = currentSearchString.trim()

    if (currentSearchString) {
      searchResultsInfoMessage = `Your searched for "${currentSearchString}".`;

      if (currentSearchString.length < 3) {
        //if search string is not empty but shorter than three symbols, generate error message;
        //search endpoint is not executed in this case as executing skipping boolean flag variable defaults to true
        searchStrTooShortErrorMessage = "Searching string must contain at least three symbols"

      } else {
        //search string is at least three symbols long, execute search query
        skipBooksFilteringQueryExecuting = false
      }

    } else {
      //search string is not set, execute books list query
      booksListQueryExecSkippingConfig.skip = false
    }
  }

  //console.log("currentSearchString", currentSearchString, 'wasRenderedForFirstTime', wasRenderedForFirstTime, 'queryConfig', booksListQueryExecSkippingConfig);
  
  const { data: booksListQueryResult = [], error: booksListQueryError, isFetching: isFetchingBooksList } =
    useGetBooksListQuery(undefined, booksListQueryExecSkippingConfig);

  const { data: booksFilteringQueryResult = [], error: booksFilteringQueryError, isFetching: isFetchingBooksFiltering } =
    useGetFilteredBooksListQuery(skipBooksFilteringQueryExecuting ? skipToken : currentSearchString);

  //one of two fethcing processes
  let currentlyFetching = isFetchingBooksList || isFetchingBooksFiltering

  if (!wasRenderedForFirstTime) {
    return null;
  }

  let booksToDisplay: Book[] = [];

  //'search' query param was set, use filtering query result
  if (currentSearchString) {
    booksToDisplay = booksFilteringQueryResult

    //if non empty search string is too short, assign empty array to currently displayable books as there may be returned non empty result
    //from previous filtering endpoint invocation, it is still assigned to booksFilteringQueryResult result variable as endpoint result is
    //not reset any way
    if (currentSearchString.length < 3) {
      booksToDisplay = []
    }

    //'search' query param was not set, all books list was queried
  } else {
    booksToDisplay = booksListQueryResult
  }



  //if books to display array is empty and fetching is done, without fetching errors display message that list is empty
  let showEmptyFavoritesListMessage;
  let showEmptyListMessage;
  // if (!currentlyFetching && booksToDisplay.length === 0) {
  //   if (listMode === FAVORITE_BOOKS_LIST) {
  //     showEmptyFavoritesListMessage = true;
  //   } else if (!currentSearchString) {
  //     //books list mode and not searching, must display message that there are no books added yet
  //     showEmptyListMessage = true;
  //   }
  // }

  let queryErrorMsg: string | undefined;

  if (booksListQueryError) {
    queryErrorMsg = extractMessageFromQueryErrorObj(booksListQueryError)
  } else if (booksFilteringQueryError) {
    queryErrorMsg = extractMessageFromQueryErrorObj(booksFilteringQueryError)
  }

  const hasAnyFetchingOrSearchStrLengthError = booksListQueryError || booksFilteringQueryError || searchStrTooShortErrorMessage

  //if fetching process is done and book list is empty a message about this fact will be snown if there are no fetching or search string  
  //length error. Custom message depending on list type 
  if (booksToDisplay.length === 0 && !currentlyFetching && !hasAnyFetchingOrSearchStrLengthError) {

    if (currentSearchString) {
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
  if (currentSearchString &&
    booksToDisplay.length > 0 &&
    !(currentlyFetching || hasAnyFetchingOrSearchStrLengthError)) {

    searchResultsInfoMessage += ` Number of records found is ${booksToDisplay.length}.`;
  }




  return (
    <>
      <div>
        {queryErrorMsg &&
          <GeneralErrorMessage msgText={queryErrorMsg} />
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
          <div>loading...</div>
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
                deleteUrl={getBookDeletionUrl(book.id, currentSearchString, listMode)} />
            )}
          </>
        }
      </div>
    </>
  )


}
