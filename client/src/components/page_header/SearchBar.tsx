import { useState, useEffect, useRef, useCallback } from 'react';
import { Book } from '../../types/Book';
import { useGetFilteredBooksListQuery } from '../../features/api/apiSlice';
import { routes } from '../../config';
import { NavLink, useNavigate } from "react-router-dom";
import { ButtonWithIcon } from '../ui_elements/ButtonWithIcon';
import { SerializedError } from '@reduxjs/toolkit';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';

function SearchBar() {
  //holds value of controlled <input/> element
  const [searchTerm, setSearchTerm] = useState("");

  //using a state variable where an {error} field's value returned by useLazyQuery will be stored. useLazyQuery does not have a method to
  //reset {error} to undefined but it is needed to remove error from UI on certain interactions: error message must be removed in all
  //cases when resetSearchBar() is called, when user navigates to other page, search string in input field becomes less than three symbols
  const [errorFromEndpoint, setErrorFromEndpoint] = useState<FetchBaseQueryError | SerializedError | undefined>(undefined);

  //maximum items to be output in quick result div
  const maxItemsCountForOutput = 5;

  
  //invoke endpoint sending request to server if search string length is at least 3 symbols, otherwise skip executing the endpoint.
  //In case error is returned seach bar must be hidden. Therefore currentData property of endpoint returned object is used as currentData
  //value becomes undefined in case of error which lets assign an empty array to search result variable
  //To force enpoint execution on every newly typed search string also if same string as was passed as endpoint argument before query cache
  //is disabled using refetchOnMountOrArgChange enpdoint option
  const trimmedSearchString = searchTerm.trim()
  const skipEndpointExecution = trimmedSearchString.length < 3

  const {
    currentData: searchQueryResult,
    isFetching,
    error: queryError
  } = useGetFilteredBooksListQuery(
    {
      filterString: trimmedSearchString,
      limit: maxItemsCountForOutput
    },
    {
      skip: skipEndpointExecution,
      refetchOnMountOrArgChange: true
    }
  )

  //extract book rows from result
  const foundBooks = searchQueryResult ? searchQueryResult.data : []

  useEffect(() => {
    const filterText = searchTerm.trim();

    //hook runs when isFetching changes from true to false and false to true; the case when isFetching is false means books filter endpoint
    //was fetching and finished fetching, the {currentData} contains fetched result, set it to result state variable, show result bar.
    //Filter text length check prevents from running code after component's first render as useEffect always runs after first render and
    //isFetching is false in that case
    if (filterText.length >= 3 && !isFetching) {

      //set current search result to state
      setSearchResult(foundBooks);

      //if search results array has items, then show the result bar
      if (foundBooks.length > 0) {
        setIsSearchResultBarVisible(true);

        //if search result is empty with current input, hide result bar, it might be visible 
        //because in previous input where something matched search text;
      } else {
        setIsSearchResultBarVisible(false);
      }
    }

  }, [isFetching]);


  useEffect(() => {
    //set current error (error value or undefined) from endpoint to state
    setErrorFromEndpoint(queryError)

    //fixing result in case of error response in case of using previously used argument by setting search result state to empty array and
    //hiding quick search result div. Currently useLazyQuery behaves following way - ff search string "boo" is sent in request and
    //successful response containing items is received, then "book" is sent and successful response containing items is received, then if
    //again "boo" is sent and error response is received, useLazyQuery returns cached result from previous response with "boo" argument
    //as a result result bar is shown. Expected behaviour of endpoint in case of error would be to return undefined, as it works when
    //sending previously not used argument "books" and error response is received
    if(queryError !== undefined){
      setSearchResult([]);
      setIsSearchResultBarVisible(false);
    }

  }, [queryError]);



  //search result list could be displayed based only on criteria that local search result variable is not empty, but we have additional
  //functionality - when user clicks any element in document outside of search bar while there are search results, 
  //result bar becomes hidden and when user focused input field (which still has same text) after that, result list is displayed again.
  //For that a state variable for search list visibility and storing rearch result is needed
  const [isSearchResultBarVisible, setIsSearchResultBarVisible] = useState(false);
  const [searchResult, setSearchResult] = useState<Book[]>([]);


  const bookListWithSearchResultUrl = routes.filteredBookListPath + "?search=" + searchTerm;

  //needed for detecting that user clicked outside of search bar div
  const beginningOfSearchBarRef = useRef(null);

  //ref to window.document for adding click event listener 
  //(for performance issues don't use directly document.addEventListener/removeEventListener)
  const documentRef = useRef(document);

  //for focusing text input field after clicking on "clear input field" button
  const searchInputFieldRef = useRef<HTMLInputElement>(null);


  /**
   * This is a function attached to window.document as "click" event handler when there is any input in search string input field.
   * Function does following - when user clicks any element except "a" or "button" tag in document outside of search bar starting div,
   * hide search result list but don't modify input field's value, user may focus it again and edit existing value;
   * If clicked inside element "a" or "button", then set result list to empty array, set search input field's value to empty string, remove
   * error near search input field and remove this function from window.document because user actially navigated to other page by
   * click on "a" or "button" tag. Button elements outside of search bar are used to redirect to other page (editing) as wall as do actions
   * like deleting and adding/removing to favorites, in those cases UI changes or spinner appears - search string value is to be cleared.
   * 
   * Event listerner function is created using useCallback() hook. This is done to be able to remove
   * previously attached event handler when needeed as on each render of React component a defined  
   * function inside component is created as new function and such function won't be removed by a 
   * document.removeEventListener() call. Using useCallback creates memorized function which
   * can be removed by removeEventListener() method.
   */
  const manageSearchBarOnClickOutsideOfSearchBar = useCallback((event: MouseEvent) => {

    let anchorOrButtonElementFound = false;
    //event.target returns object of type "EventTarget | null", it does not have any of "parentElement" that might be used to traverse
    //ancestor nodes, but it is known that click target element is a DOM element which is represented by HTMLElement type
    let eventPropogationPathElement: HTMLElement | null = event.target as HTMLElement;
    while (eventPropogationPathElement) {
      //traverse elements starting from clicked element to every next ancestor.
      //If search bar beginning element is found, don't do anytning as we have clicked inside of search bar
      if (eventPropogationPathElement === beginningOfSearchBarRef.current) {
        return;
      }

      //if one of ancestors is anchor element "a" or "button" , remember that, click was on element inside of those elements 
      if (eventPropogationPathElement.nodeName === "A" || eventPropogationPathElement.nodeName === "BUTTON" ) {
        anchorOrButtonElementFound = true;
      }

      eventPropogationPathElement = eventPropogationPathElement.parentElement;
    }

    //we have clicked outside of search bar div but don't modify search input field value
    setIsSearchResultBarVisible(false);


    //if the click was inside "a" or "button" also set search term input field's value to empty string, clear search results, remove
    //error near search input field
    if (anchorOrButtonElementFound) {
      setSearchTerm("");
      setSearchResult([]);
      setErrorFromEndpoint(undefined)
      documentRef.current.removeEventListener('click', manageSearchBarOnClickOutsideOfSearchBar);
    }
  }, [])


  /**
   * 1) manage input field value as controlled input - set it's value to state,
   * 2) hide result div if search string length less than three symbols (if length is less than three symbols, search is not performed, hide
   * any existing results).
   * 3) add or remove click handler that closes search results div when user clicks anywhere in document except search bar and clears
   * search input field if user clicks on any link (link in result div or any other in page)
   * @param {*} event 
   */

  function handleSearchTermInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const searchTermOriginal = event.target.value;
    //original text goes to state (controller input in React)
    setSearchTerm(searchTermOriginal);

    //when user inputs some string in search bar, we need to add an event lister that hides search bar on click anywhere in doc 
    //except on search bar and clears search input field if the element user clicked is an anchor to make user feel the same as
    //traditional page is navigated to page according to link (links are react-router managed)
    if (searchTermOriginal.length === 0) {
      documentRef.current.removeEventListener('click', manageSearchBarOnClickOutsideOfSearchBar);
    } else {
      documentRef.current.addEventListener('click', manageSearchBarOnClickOutsideOfSearchBar);
    }

    //for performing searching use trimmed input string
    const filterText = searchTermOriginal.trim();

    //search phrase length is less than three symbols - searching is not performed in such case.
    //If search results div is currently displayed, hide it, remove any results from results state 
    //(search bar visiblity state var might be "true" in situations when there were results from previous search input 
    //string when length was three or more symbols)
    //set errorFromEndpoint in state to undefined as search is not perfomed with string too short and endpoint will not change the error
    //value to undefined as it happens when another string is entered and endpoint is triggered again
    if (filterText.length < 3) {
      setIsSearchResultBarVisible(false);
      setSearchResult([]);
      setErrorFromEndpoint(undefined);
    }
  }



  /**
   * set all state variables of search bar to initial state, and removes related  event listener
   * Does following:
   * 1) Sets search term text input field value to empty string
   * 2) hides results bar (migth be visible from current input) 
   * 3) sets search results to empty array (migth be present with current search string input)
   * 4) set errorFromEndpoint in state to undefined to hide possible currently non empty error
   * 5) removes event listener from window.document that hides result list on search bar when user clicks anywhere in
   * documet except on search bar
   */
  function resetSearchBar() {
    setSearchTerm('');
    setIsSearchResultBarVisible(false);
    setSearchResult([]);
    setErrorFromEndpoint(undefined)
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

  const searchResultWrapperClasses = "absolute w-full mt-[-15px] pt-[15px] border border-[gray] bg-white rounded-b-[8px]";


  //items count displayed in result bar must not contain more than defined maximum items count. If there are more items in result then add
  //link to page displaying all found items (all book list URL with search string URL query param).
  //Also get slice from result array to contain at most defined maximum items number. This guards againt breaking UI by outputting too much
  //rows in quick result div in case backend returns more rows then was specified in rows limit parameter
  const totalRowsInfoFromResponseJson = searchQueryResult ? searchQueryResult.total_rows_found : 0;
  const searchResultArrForOutput = searchResult.slice(0, maxItemsCountForOutput);

  let resultCountExceedsMaxOutputCount = false;
  if (totalRowsInfoFromResponseJson > maxItemsCountForOutput) {
    resultCountExceedsMaxOutputCount = true;
  }

  return (
    <div className="flex relative grow shrink-0 basis-auto min-w-[90%] md:min-w-[unset] min-[800px]:justify-center
                    xl:absolute xl:top-1/2 xl:left-1/2 xl:[transform:translateX(-50%)_translateY(-50%)] xl:w-[500px]">

      {/*close opened search bar by clicking outside div that contains form and result list (they will be visible to
        user bounded in rectangle), the area outside this rectangle is "outside" */}
      <div className='grow shrink basis-auto relative w-full md:max-w-[485px]' ref={beginningOfSearchBarRef}>
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="search-form relative z-[12]">
          <input type='text'
            placeholder='Search book titles...'
            value={searchTerm}
            onChange={handleSearchTermInputChange}
            onFocus={handleSearchInputFocus}
            ref={searchInputFieldRef}
            className='w-full p-2.5 pr-[70px] rounded-[8px] border border-[#e5e7eb] focus:border-solid 
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


        {//condition of not fetching (!isFetching) is added to hide result bar as soon as fetching starts because instead of result bar
        //loading skeleton must be shown and value of "searchResultArrForOutput" var does not become empty immidiatelly when fetching starts
        (searchResultArrForOutput.length > 0 && !isFetching) &&
          <div className={searchResultWrapperClasses +
          (isSearchResultBarVisible
          ? " block"
          : " hidden")}>

            {searchResultArrForOutput.map((book) => {
              //display result list as book titles with link to their edit page.
              //replace bookId segment in book edit route pattern
              const editUrl = routes.bookEditPath.replace(":bookId", String(book.id));
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
            })}

            {resultCountExceedsMaxOutputCount &&
              <div onClick={handleSearchResultLinkClick}>
                <NavLink className={() => "block p-[15px] relative z-[1] text-center"}
                  to={bookListWithSearchResultUrl}>
                  Show all {totalRowsInfoFromResponseJson} found items...
                </NavLink>
              </div>
            }
          </div>
        }

        {//add sleketon while fetching
        isFetching &&
          <div className={searchResultWrapperClasses}>
            {[...Array(4)].map((e, index) =>
            <div key={index} className="p-[15px]">
              <div className="h-[19px] bg-[gray] opacity-20 rounded-[5px] animate-pulse"></div>
            </div>)
            }
          </div>
        }

        {errorFromEndpoint &&
        <div className='absolute mt-[4px] text-[red] border border-[red] rounded-[8px] mb-[15px] py-[2px] px-[10px]'>
          an error occured
        </div>}
      </div>
    </div>
  );
}
export default SearchBar;