import { useState, useEffect } from 'react';
import { SearchUrlQueryParamProcessor } from "./SearchUrlQueryParamProcessor";
import { FilteredBooksListDispatcher } from "./FilteredBooksListDispatcher";

/**
 * 
 * @param listMode - indicates current mode books list is currently working in - all books list or favorites books list. Value is passed to
 * child components to do needed calculations for display data correspoding to books list mode
 */
export function FilteredBooksListInitializer() {

  /* state variable for tracking that component renders for first time. 
  When current component is being rendered for first time (e.g. when book editing page is opened user submits search form, page is
  redirected to book list URL with 'search' query param) then render only BooksListParamProcessor as that component dispatches
  'search' query param value to Redux store only after first render. Beginning with second render output also the rest of components as
  they now have information from Redux store about 'search' param value to calculate whether filtered or all list books component must be
  displayed */
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    setIsFirstRender(false)
  }, []);

  return (
    <>
      <SearchUrlQueryParamProcessor/>

      {isFirstRender === false &&
        <FilteredBooksListDispatcher />
      }

    </>
  )
}
