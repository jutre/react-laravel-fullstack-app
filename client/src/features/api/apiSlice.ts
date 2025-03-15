import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { restApiBaseUrl } from '../../config';
import { User, UserCredentials } from '../../types/User';
import { Book } from '../../types/Book';
import { getCookie } from '../../utils/utils'


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


    // addBook: build.mutation<Book, Partial<Book>>({
    //   query(body) {
    //     return {
    //       url: `books`,
    //       method: 'POST',
    //       body,
    //     }
    //   },
    //   // Invalidates all Book-type queries providing the `LIST` id - after all, depending of the sort order,
    //   // that newly created book could show up in any lists.
    //   invalidatesTags: [{ type: 'Book', id: 'LIST' }],
    // }),


    updateBook: builder.mutation<Book, Book>({
      query: updatedBook => ({
        url: `books/${updatedBook.id}`,
        method: 'PUT',
        body: updatedBook
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'Book', id: arg.id }]
    }),

    //one endpoint for deleting one or multiple books
    deleteBook: builder.mutation<void, Book[]>({
      query(deletableBooksArray) {
        let idsArray = deletableBooksArray.map(book => book.id)
        let idsList = idsArray.join(",")
        let requestBody = JSON.stringify({ids: idsList})
        return {
          url: 'books',
          method: 'DELETE',
          body: requestBody
        }
      },
      // Invalidates all queries that provides tags which includes "id" property of each delatable Book 
      invalidatesTags: (result, error, arg) => [...arg.map(({ id }) => ({ type: 'Book', id }) as const)],
    })

  }),
})

export const { 
  useGetBooksListQuery,
  useGetFilteredBooksListQuery,
  useLazyGetFilteredBooksListQuery,
  useGetBookQuery,
  useUpdateBookMutation,
  useDeleteBookMutation } = apiSlice