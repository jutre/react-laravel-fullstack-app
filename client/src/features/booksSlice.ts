import { createSlice, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit'
import { Book } from '../types/Book.ts';
import { RootState } from "../store/store";

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
}

let initialState: BooksState = {
  searchString: null,
  booksSelectedInList: {}
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
      let bookArr = action.payload;
      bookArr.forEach((bookId) => {
        state.booksSelectedInList[bookId.id] = true;
      })
    },
    //TODO maybe add reducer for adding single book

    //removes a single book from current selection. action.payload value must be book object which should be removed from currently
    //selected books. Single book removing use case is when user chooses to remove checkmark in checkbox for a book in book list
    singleBookRemovedFromSelection(state, action: PayloadAction<Book>) {
      let book = action.payload;
      delete state.booksSelectedInList[book.id];
    },

    //removes all books currently added to selection. All books removing use case is when user has selected at least one book 
    //is selected in books list and clicks on "unselect all" button.
    //Reducer actually sets selection state to empty object as currently there is no pagination in books list, there is no
    //need to pass a list of selected books that should be removed from selection, that is there does not exist second page
    //with selected books
    allBooksRemovedFromSelection(state) {
      state.booksSelectedInList = {};
    },


    //when book(s) are deleted from books state, remove deleted books from selectem items if books are added to selection. Action for this
    //reducer is dispatched from RTK Query endpoint, payload is array of books 'id' attribute. Each key in state.booksSelectedInList object
    //conforms to book id
    booksCollectionRemovedFromSelection(state, action: PayloadAction<number[]>) {
      let bookIdsArr = action.payload;
      bookIdsArr.forEach((bookId) => {
        if (state.booksSelectedInList[bookId] === true) {
          delete state.booksSelectedInList[bookId];
        }
      })
    },



  },

  extraReducers: (builder) => {
    builder
      //when user submits different search string, clear current selection. Possibly user selected some books in previous search
      //result list but with new search string that book might be not visible in list but would be deleted together with
      //selection from current result list if user clicks  "delete all selected" button.
      //Also when user navigates from a result list to "all records" page, the selection made in result list also must be cleared
      .addCase(searchStringUpdated, (state) => {
        state.booksSelectedInList = {}
      })

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
  let selectedBookObj = state.booksState.booksSelectedInList;
  var selectedBooksCount = Object.keys(selectedBookObj).length;
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

//
/**
 * return array of book ids thare currently are selected. Return in form of array as usually in comsuming component list of 
 * values are needed, same is in current application - there wont be need to convert object to array
 * @param {*} state 
 * @returns array - array where each element is book id currently added to selection
 */
export const selectBooksInSelection = createSelector(
  (state: RootState) => state.booksState.booksSelectedInList,
  selectedBookObj => Object.keys(selectedBookObj)
)


export const { searchStringUpdated,
  bookCollectionAddedToSelection,
  singleBookRemovedFromSelection,
  allBooksRemovedFromSelection,
  booksCollectionRemovedFromSelection } = booksSlice.actions
export default booksSlice.reducer
