import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { apiSlice } from './api/apiSlice';
import { Book } from '../types/Book.ts';
import { RootState } from "../store/store";
import { STATUS_IDLE, STATUS_PENDING } from '../constants/asyncThunkExecutionStatus.ts';


/* user can choose book for deleting two ways:
   1) using delete button next to book list item which means single book is chosen for deleting, its ID will be stored in dedicated field or
   2) using delete botton in batch selection bar which means multiple books are chosen for deleting, their IDs are items added to books
   selection in list state variable*/
type DeletableBooksInfo = {
  deleteBooksIdsSource: "singleDeletableId",
  bookId: number

} | {
  deleteBooksIdsSource: "currentlySelectedBooks",
}


/**
 * book slice stores 1) current search string for sending as parameter to backend to get filtered books list;
 * 2)books list that are selected by user in book list. Selected books list will be sent to backend when user chooses
 * to delete selected books. 
 * Search string storing in Redux store also plays role in optimisation - it is not optimal to acquire page URL query
 * parameters using react-router api in component that displays books list as every query string change will force re-rendering
 * of books list. Books list page also uses other like params "deleteId" besides "searchString" query parameters and if
 * they were processed in same component then the book list would re-render when modal deleting confirmation dialog is displayed,
 * when dialog is cancelled while book list stays the same. Therefore a separate component processes query params and
 * store "searchString" parameter value in Redux store and book list re-renders only in case "searchString" changes 
 * 
 */


interface BooksState {
  searchString: string | null
  booksSelectedInList: { [index: number]: boolean }
  booksListBaseUrl: string | null
  bookDeletingEndpointLoadingStatus: "idle" | "pending"
  booksChoosenForDeleting: DeletableBooksInfo | null
}

const initialState: BooksState = {
  searchString: null,
  booksSelectedInList: {},
  booksListBaseUrl: null,
  bookDeletingEndpointLoadingStatus: "idle",
  booksChoosenForDeleting: null,
};

const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {

    //sets search string when user enters it
    searchStringUpdated(state, action: PayloadAction<string | null>) {
      state.searchString = action.payload;
    },

    //used to add a single or multiple books to selection. Single book adding use case is when user adds a single book 
    //in book list using checkbox or user clicks "select all" button then multiple books (all listed) are added to selected books state.
    //In case of single book adding to selection, action.payload array must contain one element - the book to be added to selection; 
    //In case of selecting all books from displayed list, action.payload array must contain all displayed books array - it is
    //available in parent component containing batch selection control bar
    bookCollectionAddedToSelection(state, action: PayloadAction<Book[]>) {
      const bookArr = action.payload;
      bookArr.forEach((bookId) => {
        state.booksSelectedInList[bookId.id] = true;
      })
    },
    //TODO maybe add reducer for adding single book

    //removes a single book from current selection. action.payload value must be book object which should be removed from currently
    //selected books. Single book removing use case is when user chooses to remove checkmark in checkbox for a book in book list
    singleBookRemovedFromSelection(state, action: PayloadAction<Book>) {
      const book = action.payload;
      delete state.booksSelectedInList[book.id];
    },

    //removes all books currently added to selection. All books removing use case is when user has selected at least one book 
    //is selected in books list and clicks on "unselect all" button
    allBooksRemovedFromSelection(state) {
      state.booksSelectedInList = {};
    },


    //when book(s) are deleted from books state, remove deleted books from selectem items if books are added to selection. Action for this
    //reducer is dispatched from RTK Query endpoint, payload is array of books 'id' attribute. Each key in state.booksSelectedInList object
    //conforms to book id
    booksCollectionRemovedFromSelection(state, action: PayloadAction<number[]>) {
      const bookIdsArr = action.payload;
      bookIdsArr.forEach((bookId) => {
        if (state.booksSelectedInList[bookId] === true) {
          delete state.booksSelectedInList[bookId];
        }
      })
    },


    //if dispatched URL value differs from value in state then remove all information about selected books in state as it is completely new
    //list and old selection is unrelevant; set new URL to state to track changes of URL
    booksListBaseUrlUpdated(state, action: PayloadAction<string | null>) {
      const newUrl = action.payload

      if (newUrl !== state.booksListBaseUrl) {
        const selectedBooksCount = Object.keys(state.booksSelectedInList).length;
        if (selectedBooksCount > 0) {
          state.booksSelectedInList = {}
        }

        state.booksListBaseUrl = newUrl
      }
    },

    //action to be dispatched when user clicks delete button next to book list item
    singleBookChoosenForDeleting(state, action: PayloadAction<number>) {
      state.booksChoosenForDeleting = {
        deleteBooksIdsSource: "singleDeletableId",
        bookId: action.payload
      }
    },

    //action to be dispatched when user clicks delete button in books batch selection bar
    booksCurrentSelectionChoosenForDeleting(state) {
      state.booksChoosenForDeleting = {
        deleteBooksIdsSource: "currentlySelectedBooks"
      }
    },


    // dispatched from confirmation dialog when user cancels deleting and also confirms deleting - in both cases it it is needed to hide
    // confirmation dialog, it is done by removing info about books chosen for deleting from state
    booksChoiceForDeletingCleared(state) {
      state.booksChoosenForDeleting = null
    },
  },

  extraReducers: (builder) => {
    builder

    /*
    tracking fetching statuses and returned data from api endpoint which fetches currently logged in user
    */
    .addMatcher(
      apiSlice.endpoints.deleteBook.matchFulfilled,
      (state) => {
        state.bookDeletingEndpointLoadingStatus = "idle"
      }
    )
    .addMatcher(
      apiSlice.endpoints.deleteBook.matchPending,
      (state) => {
        state.bookDeletingEndpointLoadingStatus = STATUS_PENDING
      }
    )
    .addMatcher(
      apiSlice.endpoints.deleteBook.matchRejected,
      (state) => {
        state.bookDeletingEndpointLoadingStatus = STATUS_IDLE
      }
    )
  }
});

//
//selectors
//

/**
 * returns current search string
 * 
 * @param state 
 * @returns 
 */
export const selectSearchString = (state: RootState) => state.booksState.searchString

/**
 * returns true if any book is selected. Used in book list header in batch selection checkbox to unselect or select multiple books
 * 
 * @param {*} state 
 * @returns boolean
 */
export const selectIsAnyBookSelected = (state: RootState) => {
  const selectedBookObj = state.booksState.booksSelectedInList;
  const selectedBooksCount = Object.keys(selectedBookObj).length;
  return selectedBooksCount > 0
}

/**
 * returns true if book with "id" property specified specified by bookId parameter is selected (present in books selection state)
 * @param state 
 * @param bookId 
 * @returns 
 */
export const selectIsBookAddedToSelection = (state: RootState, bookId: number) =>
  //actually ckecking if property with value equel to bookId parameter exists
  bookId in state.booksState.booksSelectedInList


export const selectBookDeletingEndpointLoadingStatus = (state: RootState) => state.booksState.bookDeletingEndpointLoadingStatus;


// Selects deletable books IDs array (each elem is integer) or null if no any book is chosen for deleting.
// If single book is selected for deleting, returns array containing single books id, if books from list selection is chosen for deleting
// returns array of currently selected books
export const selectBooksChosenForDeleting = createSelector(
  (state: RootState) => state.booksState.booksChoosenForDeleting,
  (state: RootState) => state.booksState.booksSelectedInList,
  (booksChoosenForDeletingInfo, booksSelectedInListObj) => {

    //when nothing is currently selected for deleting
    if (booksChoosenForDeletingInfo === null) {
      return null
    }

    //single book selected for deleting, return array containing single book id
    if (booksChoosenForDeletingInfo.deleteBooksIdsSource === "singleDeletableId") {
      return [booksChoosenForDeletingInfo.bookId]

    } else {
      const bookIdsAsStringVals = Object.keys(booksSelectedInListObj)

      //each object key is number, parse it to integer
      return bookIdsAsStringVals.map(idStringVal => parseInt(idStringVal))
    }

  }
)


export const { searchStringUpdated,
  bookCollectionAddedToSelection,
  singleBookRemovedFromSelection,
  allBooksRemovedFromSelection,
  booksCollectionRemovedFromSelection,
  booksListBaseUrlUpdated,
  singleBookChoosenForDeleting,
  booksCurrentSelectionChoosenForDeleting,
  booksChoiceForDeletingCleared,
} = booksSlice.actions
export default booksSlice.reducer
