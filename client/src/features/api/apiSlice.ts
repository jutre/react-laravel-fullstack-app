import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { restApiBaseUrl } from '../../config';
import { User, UserCredentials } from '../../types/User';
import { Book, NewBook, FavoriteBook } from '../../types/Book';
import { getCookie } from '../../utils/utils'
import { booksCollectionRemovedFromSelection } from '../booksSlice';


// Define a service using a base URL and expected endpoints
export const apiSlice = createApi({
  reducerPath: 'apiSlice',
  baseQuery: fetchBaseQuery({ 
    baseUrl: restApiBaseUrl,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set("Accept", "application/json")
      headers.set("Content-Type", "application/json;charset=UTF-8")
      
      //send "X-XSRF-TOKEN" header which is needed provides CSRF protection working with Laravel Sanctum authentication
      //library. Create header value from "XSRF-TOKEN" cookie's value URL decoded
      let csrfToken = getCookie("XSRF-TOKEN");
      if (csrfToken) {
        headers.set("X-XSRF-TOKEN", decodeURIComponent(csrfToken))
      }
      return headers
    }
  }),
  tagTypes: ['Book', 'FavoriteBook'],
  endpoints: (builder) => ({

    /**
     * CSRF token value will reside in cookie sent in response to this request. CSRF token needed to make login request
     */
    getCsrfCookie: builder.query<void, void>({
      query: () => "sanctum/csrf-cookie"
    }),


    /**
     * login request. Response is logged in user data if login credentials were correct
     */
    sendLoginCredentials: builder.mutation<User, UserCredentials>({
      query: loginCredentils => ({
        url: 'login',
        method: 'POST',
        body: loginCredentils
      }),
      transformResponse(response: { user: User }) {
        return response.user;
      }
    }),


    /**
     * response contains user data if HTTP session is active
     */
    getCurrentLoggedInUser: builder.query<User, void>({
      query: () => "current_logged_in_user",
      transformResponse(response: { user: User }) {
        return response.user;
      }
    }),


    
    getBooksList: builder.query<Book[], void>({
      query: () => "books",
      providesTags: (result) =>
        result
          ? // successful query, create tag for each returned list item and a tag to be invalidated when new book is created 
            [
              { type: 'Book', id: 'LIST' },
              ...result.map(({ id }) => ({ type: 'Book', id }) as const)
            ]
          :// an error occurred, but we still want to refetch this query when `{ type: 'Book', id: 'LIST' }` is invalidated
          [{ type: 'Book', id: 'LIST' }]
    }),

    getFilteredBooksList: builder.query<Book[], string>({
      query: (searchString) => `books/search/${searchString}`,
    }),

    getBook: builder.query<Book, number>({
      query: (bookId) => `books/${bookId}`,
      providesTags: (result, error, arg) => [{ type: 'Book', id: arg }]
    }),


    addBook: builder.mutation<Book, NewBook>({
      query(newBook) {
        return {
          url: 'books',
          method: 'POST',
          body: newBook,
        }
      },
      // Invalidates all Book-type queries providing the 'LIST' id - refetch list to include also newly created book
      invalidatesTags: [{ type: 'Book', id: 'LIST' }],
    }),


    updateBook: builder.mutation<Book, Book>({
      query: updatedBook => ({
        url: `books/${updatedBook.id}`,
        method: 'PUT',
        body: updatedBook
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'Book', id: arg.id }]
    }),

    //endpoint for deleting single or multiple books. Endpoint argument is array of book identifiers.
    //In case of single book argument must be array with one element, the identifier of deletable book
    deleteBook: builder.mutation<void, number[]>({
      query(deletableBooksIdsArray) {
        let requestBody = JSON.stringify({ids: deletableBooksIdsArray})
        return {
          url: 'books',
          method: 'DELETE',
          body: requestBody
        }
      },

      //dispatch action to remove deleted books from selected items state after books deletion completed
      async onQueryStarted(deletableBooksIdsArray, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          dispatch(booksCollectionRemovedFromSelection(deletableBooksIdsArray))
        } catch (err) {

        }
      },
      // Invalidates all queries that provides tags which includes "id" property of each delatable Book
      //and favorite books list fetching query provided tags (if book is deleted it must invalidate also 'FavoriteBook' tag with book's
      //identifer as if deletable book(s) was added to favorites list then new favorites list must be refetched - without that book included)
      invalidatesTags: (result, error, arg) =>
        [...arg.map(( bookId ) => ({ type: 'Book', id: bookId }) as const),
        ...arg.map(( bookId ) => ({ type: 'FavoriteBook', id: bookId }) as const)],
    }),

    /**
     * Fetches list of favorite books.
     * Favorite books list is fetched separatelly from query fetching books list although "added to favorites" logically is attribute of
     * book item in books list along with title, author it is also displayed next to title and author of book in books list. The reason
     * "added to favorites" attributes are fetched separatelly is because "added to favorites" attribute for each book can be changed in
     * book list screen and due how RTQ Query works the whole book list with all it's attributes would be re-fetched when a single book is
     * added/removed from favorites. Having favorite books list as a separate endpoint results in re-fetching only list of books that are
     * currently added to favorites list, each item containing only book ID which is more effecient in terms of transferred data.
     *  
     * Favorite books list is returned from REST API in form of array of favorite books, each favorite book is object containig only book
     * identifier.
     * Json format received from server is following -
     * [
     *   {"id":"<bookId1>"},
     *   {"id":"<bookId2>",
     *   ...
     * ]

     */

    getFavoriteBooks: builder.query<FavoriteBook[], void>({
      query: () => 'favorite-books',
      providesTags: (result) =>
        //provide { type: 'FavoriteBook', id: 'LIST' } tag, it will be invalidated when adding or removing book to favorites and 
        //{ type: 'FavoriteBook', <book id> } tags - if user deletes a book and it is added to favorites, favorite books list will be
        //re-fetched getting new list without deleted book
        result
          ?
            [
              { type: 'FavoriteBook', id: 'LIST' },
              ...result.map(({ id }) => ({ type: 'FavoriteBook', id }) as const)
            ]
          :// an error occurred, but we still want to refetch this query when `{ type: 'FavoriteBook', id: 'LIST' }` is invalidated
          [{ type: 'FavoriteBook', id: 'LIST' }]
    }),

    //adds book to favorite book. Response body is empty, excection just response code. After book is added, the favorite books list will be
    //fetched by getFavoriteBooks endpoint
    addBookToFavorites: builder.mutation<void, number>({
      query(bookId) {
        return {
          url: `favorite-books/${bookId}`,
          method: 'POST'
        }
      },
      //invalidates query that fetches list of favorite books providing the 'LIST' id - refetch favorite book list after
      //adding favorite book book
      invalidatesTags: [{ type: 'FavoriteBook', id: 'LIST' }],
    }),

    removeBookFromFavorites: builder.mutation<void, number>({
      query(removableBookId) {
        return {
          url: `favorite-books/${removableBookId}`,
          method: 'DELETE'
        }
      },

      //invalidates query that fetches list of favorite books providing the 'LIST' id - refetch favorite book list after
      //removing book from favorites
      invalidatesTags: [{ type: 'FavoriteBook', id: 'LIST' }],
    }),

  }),
})

export const { 
  useGetBooksListQuery,
  useGetFilteredBooksListQuery,
  useLazyGetFilteredBooksListQuery,
  useGetFavoriteBooksQuery,
  useGetBookQuery,
  useAddBookMutation,
  useUpdateBookMutation,
  useDeleteBookMutation,
  useAddBookToFavoritesMutation,
  useRemoveBookFromFavoritesMutation } = apiSlice