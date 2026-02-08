import { useState, useEffect } from 'react';
import { SearchUrlQueryParamProcessor } from "./SearchUrlQueryParamProcessor";
import { FilteredBooksListDispatcher } from "./FilteredBooksListDispatcher";

/**
 * Component that makes sure that search string is set to Redux store before filtered books list component is rendered.
 * On first render only component capturing search URL query param value is displayed.
 */
export function FilteredBooksListInitializer() {

  /* state variable for tracking that component renders for first time. 
  When current component is being rendered for first time (e.g. when book editing page is opened user submits search form, page is
  redirected to book list URL with 'search' query param) render only SearchUrlQueryParamProcessor as that component dispatches
  search query param value to Redux store and does only after it's first render. Beginning with second render output also component that
  renders filtered list component as search string is now available where needed */
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
