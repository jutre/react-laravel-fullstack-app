import { useEffect } from "react";
import { useAppDispatch } from '../../store/reduxHooks';
import { searchStringUpdated } from "../../features/booksSlice"
import { useSearchParams } from "react-router-dom";

/**
 * This component processes page's URL "search" query parameter setting it's value to Redux state.
 * In case "search" param is not present in URL or equals to empty string null value is set to state
 * 
 * URL query params processing is done in separate component for optimisation purpose as any URL query parameter value change
 * triggers component's re-render through react-router API, if placed directly in book list the list would also re-render.
 * 
 */

export function SearchUrlQueryParamProcessor() {
  const dispatch = useAppDispatch();

  const [searchParams] = useSearchParams()

  let searchStringParamVal = searchParams.get("search");

  //If search string length after trimming is zero convert it to null - equals to no search string entered
  if (searchStringParamVal !== null) {
    searchStringParamVal = searchStringParamVal.trim();
    if (searchStringParamVal.length === 0) {
      searchStringParamVal = null;

    }
  }

  //set new value to Redux state if "search" param value changed
  useEffect(() => {
    dispatch(searchStringUpdated(searchStringParamVal));
  }, [searchStringParamVal]);


  //nothing to return as markup, only process "search" parameter
  return null
}
