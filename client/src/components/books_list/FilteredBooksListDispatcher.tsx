import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { routes } from "../../config";
import { FilteredBooksList } from "./FilteredBooksList";
import { selectSearchString } from "../../features/booksSlice";
import { useAppSelector } from "../../store/reduxHooks";


/**
 * Makes decision which books list component to render (all books, filtered list or favorites books list) depending on listMode property
 * values and filter string URL query parameter value.
 * 
 * @param listMode - determines the books list component that will be rendered. If value is "FAVORITE_BOOKS_LIST" then favorite books list
 * component is displayed. On undefined value the decision between all books or filtered books list is made based on filter string URL query
 * parameter presence 
 */

export function FilteredBooksListDispatcher() {

  //current search string is obtained from Redux state which is set to state from URL query parameter
  const currentSearchString = useAppSelector(state => selectSearchString(state))

  //no search string - redirect to all books list after component render
  const navigate = useNavigate()
  useEffect(() => {
    if (currentSearchString === null) {
      navigate(routes.bookListPath)
    }
  }, [currentSearchString])

  if (currentSearchString !== null) {
    return <FilteredBooksList filterString={currentSearchString} />

  //no search string - return no any markup here, redirect to all books list after render
  } else {
    return null
  }
}
