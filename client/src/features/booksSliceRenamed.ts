import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit'
import { Book } from '../types/Book.ts';
import { RootState } from "../store/store";

const initialState: Book[] = [];
for (let i = 1; i <= 10; i++){
  initialState.push({
    id: i, 
    title: "This is sample title for book, we have some more text here in title " + i,
    description: "Book " + i + " description text here"})
}

const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    bookUpdated(state, action: PayloadAction<Book>){
      const bookId = action.payload.id; 
 
      /*when object for update is found, map() function must return newly created object with updated properties. 
        We can't just modify object that was referenced to from previous state array as react-redux connect()
        function will not detect that update */
      const newState = state.map((book) => {
        if(book.id === bookId){
          let newSameObject = {...book};
          return Object.assign(newSameObject, action.payload);
        }
        return book;
      })

      return newState;
    },


    bookDeleted(state, action: PayloadAction<number>){
      return state.filter( book => book.id !== action.payload)
    },


    bookCreated(state, action: PayloadAction<Book>){
      let newBookId = nextBookId(state);
      let bookDataWithId = {...action.payload, id: newBookId};
      return [ ...state, bookDataWithId];
    }

  }
});

export const { bookUpdated, bookDeleted, bookCreated } = booksSlice.actions

export default booksSlice.reducer

function nextBookId(books:Book[]) {
  const maxId = books.reduce((maxId, book) => Math.max(book.id, maxId), -1)
  return maxId + 1
}

export function getAllBooks(state: RootState): Book[] {
  return state.booksState;
}

export function getBookById(state: RootState, id: number) {
  const selectedBook = state.booksState.find(
    (book) => book.id === id
  );
  return selectedBook;
}

