import { useState, useEffect, useRef, useCallback } from 'react';
import { Book } from '../../types/Book';
import { useGetFilteredBooksListQuery } from '../../features/api/apiSlice';
import { routes, searchStringUrlQueryParamName } from '../../config';
import { useNavigate } from "react-router-dom";
import { ButtonWithIcon } from '../ui_elements/ButtonWithIcon';

function SearchBar() {
  //holds value of controlled <input/> element
  const [inputFieldValue, setInputFieldValue] = useState("");

  //contains error message in case of error from endpoint or when trying to submit form with empty search string; when search string
  //too short any error message must be removed
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  //for highlighting item in result bar using keyboard Up, Down arrow keys
  const [selectedFromResultItemIndex, setSelectedFromResultItemIndex] = useState<number | null>(null)

  //set search form input field value equal to text of result item that user highlight in quick search results bar using keyboard Up, Down
  //arrows
  useEffect(() => {
    if (selectedFromResultItemIndex !== null) {
      setInputFieldValue(searchResult[selectedFromResultItemIndex].title);
    }

  }, [selectedFromResultItemIndex])


  //maximum items to be output in quick result div
  const maxItemsCountForOutput = 5;

  
  //Invoke endpoint sending request to server if search string length is at least 3 symbols, otherwise skip executing the endpoint,
  //also skip execution when input field value is set by highlighting one of items of quick search results bar using Up/Down keyboad keys
  const trimmedSearchString = inputFieldValue.trim()
  const skipEndpointExecution = trimmedSearchString.length < 3 ||
    selectedFromResultItemIndex !== null

  //In case error is returned seach bar must be hidden therefore currentData property of endpoint returned object is used as it
  //becomes undefined in case of error. 
  //To force enpoint execution on every typed search string disable cache using refetchOnMountOrArgChange option
  const {
    currentData: foundBooks = [],
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

  /* hook sets endpoint returned result to result state variable, shows or hides result bar depending on endpoint returned object
  'currentData' property containing any books. 'isFetching' being false usually means filter endpoint was fetching and finished fetching,
  the 'currentData' contains fetched data. But not in case of first component render when search bar is just shown for first time, input
  field did not have any input, therefore filter text length is checked to be empty */
  useEffect(() => {

    if (isFetching === false &&
      trimmedSearchString !== "") {

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
    //if error is returned by endpoint set error message to general string not decoding actual returned error or set message to null value
    //if returned error is undefined
    const errFromEndpoint = queryError ? "an error occured" : null
    setErrorMessage(errFromEndpoint)

    //TODO - improve comment, obsolete
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


  //needed for detecting that user clicked outside of search bar div
  const beginningOfSearchBarRef = useRef(null);

  //ref to window.document for adding click event listener 
  //(for performance issues don't use directly document.addEventListener/removeEventListener)
  const documentRef = useRef(document);

  //for focusing text input field after clicking on "clear input field" button
  const searchInputFieldRef = useRef<HTMLInputElement>(null);

  //for submitting form programmatically
  const formRef = useRef<HTMLFormElement>(null);


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
      setInputFieldValue("");
      setSearchResult([]);
      setErrorMessage(null)
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

  function handleInputFieldChange(event: React.ChangeEvent<HTMLInputElement>) {

    //if currently any item from result bar is highligted, remove selection on typing
    setSelectedFromResultItemIndex(null)

    const inputFieldOriginalVal = event.target.value;
    //original text goes to state (controller input in React)
    setInputFieldValue(inputFieldOriginalVal);

    // when user inputs some string in search bar, we need to add an event lister that manages hiding search bar and/or clearing input field
    // when user clicks anywhere in document except on search bar
    if (inputFieldOriginalVal.length === 0) {
      documentRef.current.removeEventListener('click', manageSearchBarOnClickOutsideOfSearchBar);

    } else {
      documentRef.current.addEventListener('click', manageSearchBarOnClickOutsideOfSearchBar);
    }

    //further condition use trimmed searching value as that is the actual value that might be or not sent to backend and accordingly other
    //actions should be done
    const trimmedSearchString = inputFieldOriginalVal.trim();

    //search phrase length is less than three symbols - searching is not performed in such case.
    //If search results div is currently displayed hide it, remove possible results from previous search,
    //set errorMessage in state to null as search is not perfomed with string too short as the endpoint will not be executed which could
    //set error message to null or set new error message
    if (trimmedSearchString.length < 3) {
      setIsSearchResultBarVisible(false);
      setSearchResult([]);
      setErrorMessage(null);
    }
  }

  /**
   * Increases/decreases dedicated state variable when user clicks ArrowUp/ArrorDown keys which lets highlight a result item in quick
   * search result bar.
   * Other part of this functionality is implemented in useEffect hook with dependancy on maintained state variable which sets search bar
   * input field value to highlighted item
   * 
   * @param event - event fired on keyboard key down in search bar input field, used to get pressed key
   * 
   */
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    //prevent moving cursor to start of input field on second press on ArrowUp key
    if (event.code === "ArrowUp") {
      event.preventDefault()
    }

    //nothing to select if no any results from backend yet
    if (searchResult.length === 0) {
      return
    }

    //highlight line above currently selected if any line is selected or leave first line selected if currently first line is selected
    if (event.code === "ArrowUp") {
      setSelectedFromResultItemIndex(currentlySelectedItem => {
        if (currentlySelectedItem === null) {
          return null

        } else if (currentlySelectedItem === 0) {
          return 0

        } else {
          return currentlySelectedItem - 1
        }
      })

      //highlight first line if none is selected, line below currently selected if any line is selected or leave last line selected if
      //currently first line is selected
    } else if (event.code === "ArrowDown") {
      setSelectedFromResultItemIndex(currentlySelectedItem => {
        if (currentlySelectedItem === null) {
          return 0

        } else if (currentlySelectedItem < searchResult.length - 1) {
          return currentlySelectedItem + 1

        } else {
          return currentlySelectedItem
        }
      })

    }
  }

  /**
   * set all state variables of search bar to initial state, and removes related  event listener
   * Does following:
   * 1) Sets search term text input field value to empty string
   * 2) hides results bar (migth be visible from current input) 
   * 3) sets search results to empty array (migth be present with current search string input)
   * 4) set errorMessage in state to null to hide possible currently non empty error
   * 5) removes event listener from window.document that hides result list on search bar when user clicks anywhere in
   * documet except on search bar
   */
  function resetSearchBar() {
    setInputFieldValue('');
    setIsSearchResultBarVisible(false);
    setSearchResult([]);
    setErrorMessage(null)
    setSelectedFromResultItemIndex(null)
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


  const navigate = useNavigate();

  function redirectToFilteredBooksListUrl(searchString: string) {
    const filteredBooksListUrl = routes.filteredBookListPath + "?" + searchStringUrlQueryParamName + "=" + searchString
    navigate(filteredBooksListUrl)
  }

  /**
   * Redirects to filtered list page URL when user clicks an item in quick search bar result list. The search URL query parameter value is
   * set to clicked item text. Also resets all search bar state variable to initial state as interaction with search bar is finished
   */
  function handleSearchResultLinkClick(searchString: string) {
    resetSearchBar()
    redirectToFilteredBooksListUrl(searchString)
  }


  /**
   * Redirects to searching URL with entered search string if after trimming search string is a non empty string, otherwise displays error
   * message. In addition to redirection method resets search bar
   * 
   * @param {*} event - form submit event - used to prevent submitting of page (from navigating to submitting url)
   */
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if(trimmedSearchString !== ""){
      resetSearchBar()
      redirectToFilteredBooksListUrl(trimmedSearchString)

    }else{
      setErrorMessage("please enter a non empty string")
    }
  }

  const searchResultWrapperClasses = "absolute w-full mt-[-15px] pt-[15px] border border-[gray] bg-white rounded-b-[8px]";


  return (
    <div className="flex relative grow shrink-0 basis-auto min-w-[90%] md:min-w-[unset] min-[800px]:justify-center
                    xl:absolute xl:top-1/2 xl:left-1/2 xl:[transform:translateX(-50%)_translateY(-50%)] xl:w-[500px]">

      {/*close opened search bar by clicking outside div that contains form and result list (they will be visible to
        user bounded in rectangle), the area outside this rectangle is "outside" */}
      <div className='grow shrink basis-auto relative w-full md:max-w-[485px]' ref={beginningOfSearchBarRef}>
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="search-form relative z-[12]"
          ref={formRef}>
          <input type='text'
            placeholder='Search book titles...'
            value={inputFieldValue}
            onChange={handleInputFieldChange}
            onKeyDown={handleKeyDown}
            onFocus={handleSearchInputFocus}
            ref={searchInputFieldRef}
            className='w-full p-2.5 pr-[70px] rounded-[8px] border border-[#e5e7eb] focus:border-solid 
            bg-white focus:border-[#6b7280] focus:outline-none'/>

          <div className='absolute top-0 right-0 bottom-0 flex items-center pr-[8px]'>
            {/*show input clear button only when input is not empty*/}
            {inputFieldValue &&
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
        (searchResult.length > 0 && !isFetching) &&
          <div className={searchResultWrapperClasses +
          (isSearchResultBarVisible
          ? " block"
          : " hidden")}>

            {searchResult.map((book, index) => {
              //display result list as book titles with link to their edit page.
              //replace bookId segment in book edit route pattern
              return (
                <div key={book.id}
                  onClick={() => handleSearchResultLinkClick(book.title)}

                  className={
                    index === selectedFromResultItemIndex
                      ? "bg-[#f4f4f6]"
                      : ""}>

                  <div className="cursor-pointer p-[15px] relative z-[1] hover:bg-[#f4f4f6] ">
                    {book.title}
                  </div>
                </div>
              )
            })}
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

        {errorMessage &&
        <div className='absolute text-[red] bg-white mt-[4px] border border-[red] rounded-[8px] mb-[15px] py-[2px] px-[10px]'>
          {errorMessage}
        </div>}
      </div>
    </div>
  );
}
export default SearchBar;