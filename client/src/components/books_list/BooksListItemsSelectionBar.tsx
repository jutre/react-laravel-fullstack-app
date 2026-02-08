import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from '../../store/reduxHooks';
import { useNavigate } from "react-router-dom";
import {  bookCollectionAddedToSelection, 
          allBooksRemovedFromSelection, 
          selectIsAnyBookSelected,
          selectBooksInSelection } from "../../features/booksSlice";
import { ButtonWithIconAndBackground } from '../ui_elements/ButtonWithIconAndBackground';
import { customCheckboxSquareBoxClasses } from '../../config'
import { Book } from "../../types/Book";
import { getDeviderForNextUrlQueryStringParam } from "./BooksListBody";


type BooksListItemsSelectionBarProps = {
  allDisplayedBooks: Book[], 
  baseUrl: string
}

/**
 * This component creaters markup that displays multiple select "checkbox like" control and a delete button. Checkbox control is used
 * to do batch selecting of list items - selects all items when none is selected or deselects all if any item is selected.
 * When there are any items selected, delete button becomes active - if user clicks on it, browser url is set to deletion url
 * 
 * @param allDisplayedBooks - array of book objects currently displayed in list. In case user clicks "select all items"
 * control all books from array will be added to selected items state.
 * @param baseUrl - base path for current list (all books or favarite books list), needed to be included in delete url to
 * stay on current list when redirected to deletion url
 * @returns 
 */


function BooksListItemsSelectionBar({allDisplayedBooks, baseUrl}: BooksListItemsSelectionBarProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isAnyBookSelected = useAppSelector(state => selectIsAnyBookSelected(state));
  const selectedBooks = useAppSelector(state => selectBooksInSelection(state));

  /**
   * process logic when user click batch selection checkbox control. 
   */
  function handleBatchSelectorClick(){
    //if at least one item in list is selected than multiple select checkbox removes all selected items from selection state
    //(and checkboxes are removed from all books)
    if(isAnyBookSelected){
      dispatch(allBooksRemovedFromSelection());

    //if no any book is selected then multiple select checkbox adds all list items to selection state (and checkboxes 
    //are displayed for each book in component that displays book info)
    }else{
      dispatch(bookCollectionAddedToSelection(allDisplayedBooks));
    }
  }
  

  /**
   * Click handler on delete button. If there is any book selected then redirects to deletion url when user clicks on "Delete" button,
   * ignores click when no any book is selected (button is displayed inactive in this case).
   * 
   * Creates delete parameter value by adding selected books ids to it. 
   * If list is filtered by searching string, adds search get parameter to url
   */
  function handleRedirectToDeletionUrl(){
    if(isAnyBookSelected){
      let deleteUrl = baseUrl + getDeviderForNextUrlQueryStringParam(baseUrl) + "deleteId="+ selectedBooks.join(",");
      navigate(deleteUrl);
    }
  }

  
  //if base path changes which means page is navigated from one type of list to other, like from all books to favarite books list,
  //remove currently selected books from state as a book selected in one list can be absent in other list but still residing among
  //selected books
  useEffect(() => {
    if(isAnyBookSelected){
      dispatch(allBooksRemovedFromSelection());
    }
  }, [baseUrl]);
  

  let displayDeselectionModeDash = false;
  let batchSelectorModeTitle = "select all items";
  let deleteButtonDisabled = true;

  if(isAnyBookSelected){
    displayDeselectionModeDash = true;
    batchSelectorModeTitle = "unselect all items";
    deleteButtonDisabled = false;
  }

  return  (
    <div className="flex">

      {/*control element for all items selection or unselection. If no any list item is selected then display empty
        square, if at least one item is selected then display dash in square */}
      <div className="flex items-center pr-[15px]">
        <button 
          onClick={handleBatchSelectorClick}
          //using same styles for creating square box as for custom ckeckbox but actually this is button as checked/unchecked state is not
          //needed, button has click handler
          className={customCheckboxSquareBoxClasses +
            ( displayDeselectionModeDash
            ? "after:absolute after:w-[9px] after:h-[2px] after:rounder-[3px] after:bg-[#4066a5] after:top-1/2 after:left-1/2 after:[transform:translateX(-50%)_translateY(-50%)]"
            : "")
          }
          title={batchSelectorModeTitle}
          type="button">
        </button>
      </div>

      {/*button for redirecting to delete url. Styled as inactive when no any list item is selected. If at least one item is selected
       then display as active with background change on hover */}
      <ButtonWithIconAndBackground
        iconName = "delete"
        clickHandler={handleRedirectToDeletionUrl}
        buttonDisabled={deleteButtonDisabled}/>
    </div>
  )
}


export default BooksListItemsSelectionBar;
