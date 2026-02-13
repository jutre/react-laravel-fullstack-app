import { useEffect } from "react";
import { useAppDispatch } from '../../../store/reduxHooks';
import { booksListBaseUrlUpdated } from "../../../features/booksSlice";


/**
 * Dispatches list base URL to Redux state where reducer clears currently selected books (checkboxes next to book).
 * Base path change means page is navigated from one type of list to other as previous books list selection is not relevant in other list
 * 
 * @param baseUrl - base URL for current list
 */


export function useDispatchBooksListBaseUrl(baseUrl: string) {
  const dispatch = useAppDispatch();


  useEffect(() => {
    dispatch(booksListBaseUrlUpdated(baseUrl))

    // when component unmounts send 'null' URL value. Without that reducer would not see URL change if user opened some type of list then
    // navigated to some non list component and went back to previously opened list component as same URL value would be displatched that
    // is already in state
    return () => {
      dispatch(booksListBaseUrlUpdated(null))
    }

    // dispatch URL to Redux on mount and in case parent list re-renders with changed URL without unmounting list body component (e.g. when
    // filtered list is displayed and another search string submit follows)
  }, [baseUrl])
}
