import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { routes } from "../../config";
import { FilteredBooksList } from "./FilteredBooksList";
import { selectSearchString } from "../../features/booksSlice";
import { useAppSelector } from "../../store/reduxHooks";


/**
 * Processes case when user enters filtered URL directly in browser and does not supply search string URL query parameter.
 * If search string is not empty renders filtered book list component, otherwise redirect to all books list.
 * 
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
