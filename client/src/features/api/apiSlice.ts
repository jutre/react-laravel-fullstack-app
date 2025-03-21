import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { restApiBaseUrl } from '../../config';
import { User, UserCredentials } from '../../types/User';
import { Book, NewBook } from '../../types/Book';
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
  tagTypes: ['Book'],
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
      providesTags: (result = []) =>
        result
          ? // successful query, create tag for each returned list item and a tag to be invalidated when new book is created 
            [
              { type: 'Book', id: 'LIST' },
              ...result.map(({ id }) => ({ type: 'Book', id }) as const)
            ]
          :// an error occurred, but we still want to refetch this query when `{ type: 'Posts', id: 'LIST' }` is invalidated
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

    //one endpoint for deleting books. Endpoint argument is array of book identifiers. Can be used to delete one or multiple books,
    //in case of one book argument must be array with one element, the identifier of deletable book
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
      invalidatesTags: (result, error, arg) => [...arg.map(( bookId ) => ({ type: 'Book', bookId }) as const)],
    })

  }),
})

export const { 
  useGetBooksListQuery,
  useGetFilteredBooksListQuery,
  useLazyGetFilteredBooksListQuery,
  useGetBookQuery,
  useAddBookMutation,
  useUpdateBookMutation,
  useDeleteBookMutation } = apiSlice