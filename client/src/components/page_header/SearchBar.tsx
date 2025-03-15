import { useState, useEffect, useRef, useCallback } from 'react';
import { Book } from '../../types/Book';
import { useLazyGetFilteredBooksListQuery } from '../../features/api/apiSlice';
import { routes } from '../../config';
import { NavLink, useNavigate } from "react-router-dom";
import { ButtonWithIcon } from '../ui_elements/ButtonWithIcon';

function SearchBar() {
  //holds value of controlled <input/> element
  const [searchTerm, setSearchTerm] = useState("");


  //using {currentData} result variable not {data} as if error occurs, the {currentData} will be empty array and seach bar will be hidden
  const [trigger, { currentData: searchResultFromQuery = [], isFetching }] = useLazyGetFilteredBooksListQuery();

  useEffect(() => {
    let filterText = searchTerm.trim();

    //hook runs when isFetching changes from true to false and false to true; the case when isFetching is false means books filter endpoint
    //was fetching and finished fetching, the {currentData} contains fetched result, set it to result state variable, show result bar.
    //Filter text length check prevents from running code after component's first render as useEffect always runs after first render and
    //isFetching is false in that case
    if (filterText.length >= 3 && !isFetching) {

      //set current search result to state
      setSearchResult(searchResultFromQuery);

      //if search results array has items, then show the result bar
      if (searchResultFromQuery.length > 0) {
        setIsSearchResultBarVisible(true);

        //if search result is empty with current input, hide result bar, it might be visible 
        //because in previous input where something matched search text;
      } else {
        setIsSearchResultBarVisible(false);
      }
    }

    console.log('[isFetching]', isFetching, "searchResultFromQuery", searchResultFromQuery);
  }, [isFetching]);



  //search result list could be displayed based only on criteria that local search result variable is not empty, but we have additional
  //functionality - when user clicks any element in document outside of search bar while there are search results, 
  //result bar becomes hidden and when user focused input field (which still has same text) after that, result list is displayed again.
  //For that a state variable for search list visibility and storing rearch result is needed
  const [isSearchResultBarVisible, setIsSearchResultBarVisible] = useState(false);
  const [searchResult, setSearchResult] = useState<Book[]>([]);


  let bookListWithSearchResultUrl = routes.bookListPath + "?search=" + searchTerm;

  //needed for detecting that user clicked outside of search bar div
  const beginningOfSearchBarRef = useRef(null);

  //ref to window.document for adding click event listener 
  //(for performance issues don't use directly document.addEventListener/removeEventListener)
  const documentRef = useRef(document);

  //for focusing text input field after clicking on "clear input field" button
  const searchInputFieldRef = useRef<HTMLInputElement>(null);


  /**
   * This is a function attached to window.document as "click" event handler when there is any input in search string input field.
   * Function does following - when user clicks any element except anchor ("a" tag) in document outside of search bar starting div, 
   * hide search result list; if clicked element was inside anchor ("a" tag), then additionally set result list to empty array,
   * set search input field's value to empty string and remove this function from window.document, actually "reset" search bar 
   * as user havigated to other page.
   * Event listerner function is created using useCallback() hook. This is done to be able to remove
   * previously attached event handler when needeed as on each render of React component a defined  
   * function inside component is created as new function and such function won't be removed by a 
   * document.removeEventListener() call. Using useCallback creates memorized function which
   * can be removed byremoveEventListener() method.
   */
  const manageSearchBarOnClickOutsideOfSearchBar = useCallback((event: MouseEvent) => {

    let anchorElementFound = false;
    //event.target returns object of type "EventTarget | null", it does not have any of "parentElement" that might be used to traverse
    //ancestor nodes, but it is known that click target element is a DOM element which is represented by HTMLElement type
    let eventPropogationPathElement: HTMLElement | null = event.target as HTMLElement;
    while (eventPropogationPathElement) {
      //traverse elements starting from clicked element to every next ancestor.
      //If search bar beginning element is found, don't do anytning as we have clicked inside of search bar
      if (eventPropogationPathElement === beginningOfSearchBarRef.current) {
        return;
      }

      //if one of ancestors is anchor element <a></a>, remember that, click was on element inside anchor
      if (eventPropogationPathElement.nodeName === "A" && anchorElementFound === false) {
        anchorElementFound = true;
      }

      eventPropogationPathElement = eventPropogationPathElement.parentElement;
    }

    //we have clicked outside of search bar div - 
    //hide search results bar - set menu opened state to false. It might be already be
    //hidden (state is 'false'), setting it to 'false' again won't cause re-render, don't check "if it is already 'false'"
    //(we can't check current React's components state variable conveniently in event handler attached
    //outside of component because of React lifecycle; possible could with some additional hacks, but we won't do it this time)
    setIsSearchResultBarVisible(false);


    //if the click was inside anchor element, also set search term input field's value to empty string and clear search results.
    //A click on link outside of search bar means a user is navigated to same page according to react-router setup but search
    //bar remains unchanged. Here result list is removed and input field is cleared to make user feel as he is traditionally
    //navigated to other page. Also remove current event handler as search bar is not used when navigated to new page
    if (anchorElementFound) {
      setSearchTerm("");
      setSearchResult([]);
      documentRef.current.removeEventListener('click', manageSearchBarOnClickOutsideOfSearchBar);
    }
  }, [])


  /**
   * depending on current search text input field value, performs search, displays result list in popup div
   * @param {*} event 
   */

  function handleSearchTermInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    let searchTermOriginal = event.target.value;
    //original text goes to state (controller input in React)
    setSearchTerm(searchTermOriginal);

    //when user inputs some string in search bar, we need to add an event lister that hides search bar on click anywhere in doc 
    //(except on search bar) and additionally clears search input field if the element user clicked is an anchor (link)
    //to make user feel the same as traditional page is navigated to page according to link (we need those actions
    //as links are react-router managed)
    if (searchTermOriginal.length === 0) {
      documentRef.current.removeEventListener('click', manageSearchBarOnClickOutsideOfSearchBar);
    } else {
      documentRef.current.addEventListener('click', manageSearchBarOnClickOutsideOfSearchBar);
    }

    //for performing searching use trimmed input string
    let filterText = searchTermOriginal.trim();

    //search phrase length is less than three symbols - searching is not performed in such case.
    //If search results div is currently displayed, hide it, remove any results from results state 
    //(search bar visiblity state var might be "true" in situations when there were results from previous search input 
    //string when length was three or more symbols)
    if (filterText.length < 3) {
      setIsSearchResultBarVisible(false);
      setSearchResult([]);
      console.log('setting result to empty');

      //send search request, search phrase at least three symbols long. A useEffect hook will process the result
    } else {
      trigger(filterText);
    }
  }



  /**
   * set all state variables of search bar to initial state, and removes related  event listener
   * Does following:
   * 1) Sets search term text input field value to empty string
   * 2) hides results bar (migth be visible from current input) 
   * 3) sets search results to empty array (migth be present with current search string input)
   * 4) removes event listener from window.document that hides result list on search bar when user clicks anywhere in 
   * documet except on search bar
   */
  function resetSearchBar() {
    setSearchTerm('');
    setIsSearchResultBarVisible(false);
    setSearchResult([]);
    documentRef.current.removeEventListener('click', manageSearchBarOnClickOutsideOfSearchBar);
  }

  /**
   * when use clicks "clear input field" button then resets search bar and focus on search phrase input field
   */
  function handleSearchInputClearing() {
    if (searchInputFieldRef.current !== null) {
      searchInputFieldRef.current.focus();
    }
    resetSearchBar();
  }

  /**
    * when search string input field becomes focused and there are search results then display resut list
    * (search results might be present with current string in input field, but hidden as user removed focus 
    * from input field)
    */
  function handleSearchInputFocus() {
    if (searchResult.length > 0) {
      setIsSearchResultBarVisible(true);
    }
  }

  /**
   * Removes entered string from search input field and clears related state variables when user clicks on link in 
   * search bar result list.
   * 
   * When user clicks on a link in search result list, the page does not refresh as links are react-router managed, 
   * the seach bar does not change anyway visually and technically - result list is visible, input field contains endred string.
   * To make user feel the same as traditional page is navigated to page according to link, we must hide result list and 
   * clear input field.
   * This metod resets all state variables in search bar:
   * - set search term text input field value to empty string,
   * - hide result list
   * - set search results to empty array
   * - remove event listener to document that manages search bar when user clicks anywhere in doc except on search bar
   * 
   * The click bubbles from a clicked react-rounter link, this method must be set as click event handler to a parent element
   * of react-router created link to immidiatelly capture the click event and be executed. React router manages routing as needed
   * and displays content in dedicated section, but it this event handler search bar ir cleared
   */
  function handleSearchResultLinkClick() {
    resetSearchBar();
  }



  const navigate = useNavigate();

  /**
   * Removes entered string from search input field and clears related state variables when user submits search form
   * and redirects to book list url with added "search" query parameter with value as string that is entered in
   * search bar input field.
   * 
   * The redirection after form submittion is done using react-router, the page is not navigated or redirected, 
   * the seach bar does not change anyway visually and technically - result list is visible, input field contains endred string.
   * To make user feel the same as traditional page is navigated to page when submitted, we must hide result list and 
   * clear input field.
   * This metod resets all state variables in search bar:
   * - set search term text input field value to empty string,
   * - hide result list
   * - set search results to empty array
   * - remove event listener to document that manages search bar when user clicks anywhere in doc except on search bar
   * 
   * @param {*} event - form submit event - used to prevent submitting of page (from navigating to submitting url)
   */
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    //reset search bar after we add current searchTerm to url as resetting search bar sets searchTerm to empty string
    resetSearchBar();
    navigate(bookListWithSearchResultUrl);
  }

  //calculate search bar class
  let searchResultsCssClassName = "absolute w-full mt-[-15px] pt-[15px] border border-[gray] bg-white rounded-b-lg";
  if (isSearchResultBarVisible) {
    searchResultsCssClassName += " block";
  } else {
    searchResultsCssClassName += " hidden";
  }


  //result bar displays not more than defined items count. If there are more items in results, display link to all
  //results listing page which leads to book list url with entered search string
  let searchResultArrForOutput;
  let maxItemsCountForOutput = 5;
  let resultCountExceedsMaxOutputCount = false;
  if (searchResult.length > maxItemsCountForOutput) {
    searchResultArrForOutput = searchResult.slice(0, maxItemsCountForOutput);
    resultCountExceedsMaxOutputCount = true;
  } else {
    searchResultArrForOutput = searchResult;
  }

  return (
    <div className="flex relative grow shrink-0 basis-auto min-w-[90%] md:min-w-[unset] min-[800px]:justify-center
                    xl:absolute xl:top-1/2 xl:left-1/2 xl:[transform:translateX(-50%)_translateY(-50%)] xl:w-[500px]">
      {/*TODO - implement spinner correctly styled, removing for now
      isFetching &&
        <div> getting books</div>
      */}

      {/*close opened search bar by clicking outside div that contains form and result list (they will be visible to
        user bounded in rectangle), the area outside this rectangle is "outside" */}
      <div className='grow shrink basis-auto relative w-full md:max-w-[485px]' ref={beginningOfSearchBarRef}>
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="search-form relative z-[12]">
          <input type='text'
            value={searchTerm}
            onChange={handleSearchTermInputChange}
            onFocus={handleSearchInputFocus}
            ref={searchInputFieldRef}
            className='w-full p-2.5 pr-[70px] rounded-lg border border-[#e5e7eb] focus:border-solid 
            bg-white focus:border-[#6b7280] focus:outline-none'/>

          <div className='absolute top-0 right-0 bottom-0 flex items-center pr-[8px]'>
            {/*show input clear button only when input is not empty*/}
            {searchTerm &&
              <ButtonWithIcon
                clickHandler={handleSearchInputClearing}
                beforeElemMaskImgUrlTwCssClass="before:[mask-image:url(assets/clear-form.svg)]"
                beforeElemMaskSizeTwCssClass="before:[mask-size:13px]"
                beforeElemBackgndColorTwCssClass="before:bg-red-500"
                otherClasses="w-[36px] h-[36px] bg-transparent p-0 relative z-[20]" />
            }

            {/*submit button for current search form*/}
            <ButtonWithIcon
              beforeElemMaskImgUrlTwCssClass="before:[mask-image:url(assets/search-submit.svg)]"
              beforeElemMaskSizeTwCssClass="before:[mask-size:21px]"
              beforeElemBackgndColorTwCssClass="before:bg-black"
              otherClasses="w-[36px] h-[36px] bg-transparent p-0 relative z-[20]"
              buttonTypeAttrValue="submit" />
          </div>
        </form>

        <div className={searchResultsCssClassName}>

          {searchResultArrForOutput.map((book) => {
            //display result list as book titles with link to their edit page.
            //replace bookId segment in book edit route pattern
            let editUrl = routes.bookEditPath.replace(":bookId", String(book.id));
            return (
              <div key={book.id}
                className="relative before:block before:absolute before:left-1/2 before:translate-x-[-50%] before:top-0 
                    before:bg-[#f4f4f6] before:h-full before:w-0 last:before:rounded-b-[8px] hover:before:w-full 
                    before:transition-all before:ease-in before:duration-100"
                onClick={handleSearchResultLinkClick}>
                <NavLink className={() => "block p-[15px] relative z-[1] hover:text-[#1f2937]"}
                  to={editUrl}>{book.title}
                </NavLink>
              </div>
            )
          }
          )}

          {resultCountExceedsMaxOutputCount &&
            <div onClick={handleSearchResultLinkClick}>
              <NavLink className={() => "block p-[15px] relative z-[1] text-center"}
                to={bookListWithSearchResultUrl}>
                Show all {searchResult.length} found items...
              </NavLink>
            </div>
          }
        </div>
      </div>
    </div>
  );
}
export default SearchBar;