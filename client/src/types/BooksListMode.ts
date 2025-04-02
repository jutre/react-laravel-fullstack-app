/**
 * indicates mode in which books list might be working in - it might be mode displaying all books list ('listMode' value is undefined) or
 * mode displaying favorites books list ('listMode' value is "FAVORITE_BOOKS_LIST") 
 */

export type BooksListModes = "FAVORITE_BOOKS_LIST" | undefined
export type BooksListModeParams = {
  listMode?: BooksListModes
}
