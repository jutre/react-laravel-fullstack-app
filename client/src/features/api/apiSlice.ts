import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { createEntityAdapter,
  EntityState,
  createSelector } from '@reduxjs/toolkit';
import { User, UserCredentials } from '../../types/User';
import { Book, NewBook } from '../../types/Book';
import { getCookie } from '../../utils/utils'
import { booksCollectionRemovedFromSelection } from '../booksSlice';
import { LiteraryGenre } from '../../types/LiteraryGenre';

type FilterQueryResultJsonFormat = {
  data: Book[],
  total_rows_found: number
}

type FilterQueryInputParameter = {
  filterString: string,
  limit?: number
}


//EntityAdapter will be used to generate selectors returning literary genres data in at least two shapes
const literaryGenresAdapter = createEntityAdapter<LiteraryGenre>()
const initialStateForLiteraryGenres = literaryGenresAdapter.getInitialState()

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

  tagTypes: ['BookGeneralInfo', 'BookFullInfo', 'BookFavoriteFieldInfo'],

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


    getLiteraryGenres: builder.query<EntityState<LiteraryGenre, number>, void>({
      query: () => '/literary_genres',
      transformResponse(res: LiteraryGenre[]) {
        // Create a normalized state object containing all the literary genre items
        return literaryGenresAdapter.setAll(initialStateForLiteraryGenres, res)
      }
    }),

    
    getBooksList: builder.query<Book[], void>({
      query: () => "books",
      providesTags: (result) =>
        result
          ? //each book list item contains just basic info, provide dedicated tag for each book and a tag to be invalidated when new book is
            //created 
            [
              { type: 'BookGeneralInfo', id: 'LIST' },
              ...result.map(({ id }) => ({ type: 'BookGeneralInfo', id }) as const)
            ]
          : // an error occurred, refetch this query when `{ type: 'BookGeneralInfo', id: 'LIST' }` is invalidated f.e. new book is added
          [{ type: 'BookGeneralInfo', id: 'LIST' }]
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
              { type: 'BookGeneralInfo', id: 'LIST' },
              ...result.data.map(({ id }) => ({ type: 'BookGeneralInfo', id }) as const)
            ]
          : // an error occurred, refetch this query when `{ type: 'BookGeneralInfo', id: 'LIST' }` is invalidated f.e. new book is added
          [{ type: 'BookGeneralInfo', id: 'LIST' }]

    }),

    getBook: builder.query<Book, number>({
      query: (bookId) => `books/${bookId}`,
      //single book privides {'BookGeneralInfo', id: <bookId>} and {'BookFavoriteFieldInfo', id: <bookId>} tags as it also contains
      //"marked_as_favorite" field which lets invalidate single book cache if book is removed from favorites in Favorite books list
      providesTags: (result, error, arg) => [
        { type: 'BookGeneralInfo', id: arg }, 
        { type: 'BookFavoriteFieldInfo', id: arg }]
    }),


    addBook: builder.mutation<Book, NewBook>({
      query(newBook) {
        return {
          url: 'books',
          method: 'POST',
          body: newBook,
        }
      },
      //refetch books list to include also newly created book and favorite books list as book creating form has a field for
      //marking book as favorite, we don't know whether book was or not marked as favorite, must refetch whole favorite books list
      invalidatesTags: 
        [{ type: 'BookGeneralInfo', id: 'LIST' }, 
        { type: 'BookFavoriteFieldInfo', id: 'LIST' }],
    }),


    updateBook: builder.mutation<Book, Book>({
      query: updatedBook => ({
        url: `books/${updatedBook.id}`,
        method: 'PUT',
        body: updatedBook
      }),
      //on book update invalidate {'BookGeneralInfo', id: <updatable bookId>} tag for invalidating all books list containing such book,
      //{'FavoriteBook': 'LIST'} tag as book edit form has a field for marking book as favorite book, we don't know to what value user
      //submits as this field value is sent to server in single json with other book data, the only way to get the actual info is to refetch
      //whole favorite books list 
      invalidatesTags: (result, error, arg) =>
        [{ type: 'BookGeneralInfo', id: arg.id },
        { type: 'BookFavoriteFieldInfo', id: 'LIST' }]
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
      //Invalidates all queries that provides {'BookGeneralInfo', "id": <each deletable bookId>} tags (all books list, filtered books list,
      //single book info) and favorite books list query provided tags, to refetch favorites list if deletable book(s) is added to favorites
      invalidatesTags: (result, error, arg) =>
        [...arg.map(( bookId ) => ({ type: 'BookGeneralInfo', id: bookId }) as const),
        ...arg.map(( bookId ) => ({ type: 'BookFavoriteFieldInfo', id: bookId }) as const)],
    }),


    /**
     * Fetches list of favorite books when user chooses "Favorite books" section to get favorite books from backend.
     */

    getFavoriteBooks: builder.query<Book[], void>({
      query: () => 'favorite-books',
      providesTags: (result) =>
        //provide { type: 'BookFavoriteFieldInfo', id: 'LIST' } tag, it will be invalidated when user saves or updates book data
        //{ type: 'BookFavoriteFieldInfo', <book id> } tags to refetch favorites list if user deletes a book
        result
          ?
            [
              { type: 'BookFavoriteFieldInfo', id: 'LIST' },
              ...result.map(({ id }) => ({ type: 'BookFavoriteFieldInfo', id }) as const)
            ]
          :// an error occurred, but we still want to refetch this query when `{ type: 'BookFavoriteFieldInfo', id: 'LIST' }` is invalidated
          [{ type: 'BookFavoriteFieldInfo', id: 'LIST' }]
    }),


    removeBookFromFavorites: builder.mutation<void, number>({
      query(removableBookId) {
        return {
          url: `favorite-books/${removableBookId}`,
          method: 'DELETE'
        }
      },

      //invalidate queries providing {type: 'BookFavoriteFieldInfo', id: <each removable bookId>} - refetch favorite book list after
      //removing book in favorites list using appropriate button, and single book query data as it also has 'Added to favorites'
      invalidatesTags: (result, error, arg) => [
        { type: 'BookFavoriteFieldInfo', id: arg }
      ]
    }),


    resetDemoData: builder.mutation<void, void>({
      query() {
        return {
          url: 'demo-data-reset',
          method: 'POST',
        }
      },
      //refetch books list and favorite books list after data reset
      invalidatesTags: [
        { type: 'BookGeneralInfo', id: 'LIST' },
        { type: 'BookFavoriteFieldInfo', id: 'LIST' }]
    })

  }),
})

export const {
  useUserLogoutMutation,
  useGetBooksListQuery,
  useGetFilteredBooksListQuery,
  useLazyGetFilteredBooksListQuery,
  useGetFavoriteBooksQuery,
  useGetBookQuery,
  useAddBookMutation,
  useUpdateBookMutation,
  useDeleteBookMutation,
  useRemoveBookFromFavoritesMutation,
  useResetDemoDataMutation } = apiSlice


export const selectGenresResult = apiSlice.endpoints.getLiteraryGenres.select()

const selectLiteraryGenreData = createSelector(
  selectGenresResult,
  // Fall back to the empty entity state if no response yet.
  result => result.data ?? initialStateForLiteraryGenres
)
export const { 
  selectAll: selectAllLiteraryGenres, 
  selectEntities: selectLiteraryGenreEntities } = literaryGenresAdapter.getSelectors(selectLiteraryGenreData)
