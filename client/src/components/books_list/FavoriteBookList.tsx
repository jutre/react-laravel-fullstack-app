import { BooksListBody } from "./BooksListBody.tsx";
import { useGetFavoriteBooksQuery, useRemoveBookFromFavoritesMutation } from '../../features/api/apiSlice.ts';
import { findNonEmptyErrorFromList, extractMessageFromQueryErrorObj } from '../../utils/utils.ts';
import { FAVORITE_BOOKS_LIST } from "../../constants/bookListModes";


/**
 * Fetches favorite books list from REST API and displays list items, loading state, errors, etc. in component creating books list HTML
 * markup. Also sends request to REST API when user is clicks button for removing book from favorites list
 * 
 */

export function FavoriteBookList() {

  const { data: favoriteBooksListQueryData,
    error: favoriteBooksListQueryError,
    isFetching: isFetching } = useGetFavoriteBooksQuery()


  const [triggerRemoveFromFavoritesMutation, {
    error: removeFromFavoritesMutationError,
    isLoading: isRemoveFromFavoritesFetching }] = useRemoveBookFromFavoritesMutation()


  const errorFromAnyEndpoint = findNonEmptyErrorFromList(favoriteBooksListQueryError,
    removeFromFavoritesMutationError)

  let errorMsgFromEndpoint: string | undefined
  if (errorFromAnyEndpoint) {
    errorMsgFromEndpoint = extractMessageFromQueryErrorObj(errorFromAnyEndpoint)
  }


  let messageWhenBooksListIsEmpty = (
    <p>
      <strong>There are no books added to favorite books list.</strong> <br /><br />
      Book can be added to favorites in book edit form.
    </p>
  )


  return (
    <>
      <BooksListBody
        listMode={FAVORITE_BOOKS_LIST}
        listItems={favoriteBooksListQueryData}
        isFetchingData={isFetching}
        errorMessage={errorMsgFromEndpoint}
        listHeader="Favorite books"
        messageWhenBooksListIsEmpty={messageWhenBooksListIsEmpty}
        isRemovingFromFavorites={isRemoveFromFavoritesFetching}
        removeFromFavoritesCallback={triggerRemoveFromFavoritesMutation} />
    </>
  )
}
