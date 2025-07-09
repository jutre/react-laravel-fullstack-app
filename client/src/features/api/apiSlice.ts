import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { User, UserCredentials } from '../../types/User';
import { Book, NewBook, FavoriteBook } from '../../types/Book';
import { getCookie } from '../../utils/utils'
import { booksCollectionRemovedFromSelection } from '../booksSlice';

type FilterQueryResultJsonFormat = {
  data: Book[],
  total_rows_found: number
}

type FilterQueryInputParameter = {
  filterString: string,
  limit?: number
}

// Define a service using a base URL and expected endpoints
export const apiSlice = createApi({
  reducerPath: 'apiSlice',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost/laravel_books_api/public/api/',
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set("Accept", "application/json")
      headers.set("Content-Type", "application/json;charset=UTF-8")
      
      //send "X-XSRF-TOKEN" header which is needed provides CSRF protection working with Laravel Sanctum authentication
      //library. Create header value from "XSRF-TOKEN" cookie's value URL decoded
      const csrfToken = getCookie("XSRF-TOKEN");
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
     * sends logout request
     */
    userLogout: builder.mutation<void, void>({
      query: () => ({
        url: 'login',
        method: 'DELETE'
      })
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
          : // an error occurred, refetch this query when `{ type: 'Book', id: 'LIST' }` is invalidated f.e. new book is added
          [{ type: 'Book', id: 'LIST' }]
    }),

    /*
    filtering string parameter contains search string and optional limit parameter. Limit parameter is used to limit number of records
    received in response which is used to optimise request for quick search component as only few records are displayed in results div;
    record amount limiting is not used in filtered books list body
    */
    getFilteredBooksList: builder.query<FilterQueryResultJsonFormat, FilterQueryInputParameter>({
      query: (searchStringAndLimit) => `books/search/${searchStringAndLimit.filterString}` +
        (searchStringAndLimit.limit ? `?limit=${searchStringAndLimit.limit}` : ''),

      //privide tags for book filtering list as in filtering result list there is option to delete any of found books and after deletion 
      //result list must be re-fetched immediatelly
      providesTags: (result) =>
        (result && result.data)
          ? // successful query, create tag for each returned book and a tag to make query invalidated when new book is created 
            [
              { type: 'Book', id: 'LIST' },
              ...result.data.map(({ id }) => ({ type: 'Book', id }) as const)
            ]
          : // an error occurred, refetch this query when `{ type: 'Book', id: 'LIST' }` is invalidated f.e. new book is added
          [{ type: 'Book', id: 'LIST' }]

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
      //refetch books list to include also newly created book and also favorite books ids list as book edit screen has a field for
      //adding or removing book from Favorites list
      invalidatesTags: 
        [{ type: 'Book', id: 'LIST' }, 
        { type: 'FavoriteBook', id: 'LIST' }],
    }),


    updateBook: builder.mutation<Book, Book>({
      query: updatedBook => ({
        url: `books/${updatedBook.id}`,
        method: 'PUT',
        body: updatedBook
      }),
      //on book update invalidate {'Book', id: <updatable bookId>} tag and {'FavoriteBook': 'LIST'} tag as book edit screen has a field for
      //adding or removing book from Favorites list, so after book saving also reload also favorite books ids list
      invalidatesTags: (result, error, arg) =>
        [{ type: 'Book', id: arg.id }, 
        { type: 'FavoriteBook', id: 'LIST' }]
    }),

    //endpoint for deleting single or multiple books. Endpoint argument is array of book identifiers.
    //In case of single book argument must be array with one element, the identifier of deletable book
    deleteBook: builder.mutation<void, number[]>({
      query(deletableBooksIdsArray) {
        const requestBody = JSON.stringify({ids: deletableBooksIdsArray})
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          //in case of error not modifying selected items state
        }
      },
      // Invalidates all queries that provides {'Book', "id" <each deletable bookId>} tags
      //and favorite books list fetching query provided tags (if book is deleted it must invalidate also 'FavoriteBook' tag with book's
      //identifer as if deletable book(s) was added to favorites list then new favorites list must be refetched - without that book included)
      invalidatesTags: (result, error, arg) =>
        [...arg.map(( bookId ) => ({ type: 'Book', id: bookId }) as const),
        ...arg.map(( bookId ) => ({ type: 'FavoriteBook', id: bookId }) as const)],
    }),

    /**
     * Fetches list of favorite books identifiers.
     * Favorite books list is fetched separatelly from query fetching books list although "added to favorites" logically is attribute of
     * book item in books list along with title, etc., "added to favorites" icon is displayed next to title and author in books list. The
     * reason books that are added to favorites are fetched separatelly is because "added to favorites" attribute for each book is
     * changeable in book list and due how RTQ Query works the whole book list with all attributes would be re-fetched when a single book is
     * added/removed from favorites. Having favorite books list as a separate endpoint results in re-fetching only list of identifiers of
     * books that are currently added to favorites list when addeding/removing book from favorites. Each item in favorite books list
     * contains only book 'id' field. Such approach is more effecient in terms of transferred data per book, also there may be few books
     * added to favorites which also results in smaller transferred data amount on adding/removing book from favorites.
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

    getFavoriteBooksIdentifiers: builder.query<FavoriteBook[], void>({
      query: () => 'favorite-books?include_only_book_identifiers=true',
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


    /**
     * Fetches list of favorite books.
     * This endpoint is used when user chooses "Favorite books" section, favorite books is returned from backend. In favorite books list
     * user can only remove book from favorites, it is done the whole favorites list will be refetched.
     * Returned favorite books list contains all attributes (id, title, author, preface), but information that book is also in favorites
     * list is taken from favorite list returned by getFavoriteBooksIdentifiers endpoint which is used also in all books list to identify
     * which books are added to favorites. This way favorite books in favorites list and all books list are identified to be added to
     * favorites by same code the only difference is the list of books to be displayed.
     *
     * Json format received from server is following -
     * [
     *   {"id":"<bookId1>", "author":"<author>", "title":"<title>", "preface":"<preface>"},
     *   {"id":"<bookId2>", "author":"<author>", "title":"<title>", "preface":"<preface>"},
     *   ...
     * ]
     */

    getFavoriteBooks: builder.query<Book[], void>({
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
      //adding favorite book book and also invalidate 'Book' tags with id of book that was added to favorites - possible cached editable
      //book data with suplied id must be reloaded as edit form has 'Added to favorites' field which is changed now
      invalidatesTags: (result, error, arg) => [
        { type: 'FavoriteBook', id: 'LIST' },
        { type: 'Book', id: arg }
      ],
    }),

    removeBookFromFavorites: builder.mutation<void, number>({
      query(removableBookId) {
        return {
          url: `favorite-books/${removableBookId}`,
          method: 'DELETE'
        }
      },

      //invalidates query that fetches list of favorite books providing the 'LIST' id - refetch favorite book list after
      //removing book from favorites also invalidate 'Book' tags with id of book that was added to favorites - possible cached editable
      //book data with suplied id must be reloaded as edit form has 'Added to favorites' field which is changed now
      invalidatesTags: (result, error, arg) => [
        { type: 'FavoriteBook', id: 'LIST' },
        { type: 'Book', id: arg }
      ]
    }),


    resetDemoData: builder.mutation<void, void>({
      query() {
        return {
          url: 'demo-data-reset',
          method: 'POST',
        }
      },
      //refetch books list after data reset
      invalidatesTags: [{ type: 'Book', id: 'LIST' }]
    })

  }),
})

export const {
  useUserLogoutMutation,
  useGetBooksListQuery,
  useGetFilteredBooksListQuery,
  useLazyGetFilteredBooksListQuery,
  useGetFavoriteBooksIdentifiersQuery,
  useGetFavoriteBooksQuery,
  useGetBookQuery,
  useAddBookMutation,
  useUpdateBookMutation,
  useDeleteBookMutation,
  useAddBookToFavoritesMutation,
  useRemoveBookFromFavoritesMutation,
  useResetDemoDataMutation } = apiSlice