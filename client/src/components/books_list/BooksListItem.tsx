import { useAppDispatch, useAppSelector } from '../../store/reduxHooks';
import { useNavigate } from "react-router-dom";
//import { bookFavoriteStateToggled } from "../../features/favoriteBooksSlice";
import { 
  bookCollectionAddedToSelection, 
  singleBookRemovedFromSelection,
  selectIsBookAddedToSelection } from "../../features/booksSlice";
import { ButtonWithIconAndBackground } from '../ui_elements/ButtonWithIconAndBackground';
import { Book } from '../../types/Book';

type BookListItemProps = {
  book: Book,
  editUrl: string,
  deleteUrl: string
}

export function BookListItem({book, editUrl, deleteUrl}: BookListItemProps) {
  //TODO maybe remove comment
  //button with redirection will be used instead of react router <Link/> element to have uniform styling - 
  //most of elements on page are html <button> elements, only couple of anchor <a/> elements might be needed on page
  //use <ButtonWithIcon/> component which generates <button> with click handler that redirects to needed url
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const isBookAddedToSelection = useAppSelector((state) => selectIsBookAddedToSelection(state, book.id));

  /**
   * handles checbox checking/unchecking event for a single book by adding or removing that book to selection for deleting.
   * Adds to deletable books selection when checkbox is checked and removes from selection if checbox is unchecked
   * @param {change event object} event 
   */
  function handleBookSelectionForDeleting(event: React.ChangeEvent<HTMLInputElement>){
    let isCheckboxChecked = event.target.checked;
    if(isCheckboxChecked){
      //a general function for adding a collection of books is used to add single book to selection, action.payload value must be 
      //an array consisting of single element which value is book.id 
      dispatch(bookCollectionAddedToSelection([book]));

    }else{
      //to remove a book from selection, action.payload value must be integer - book.id to be removed from selection
      dispatch(singleBookRemovedFromSelection(book));
    }
  }

  /**
   * when cliking on favourites icon, add or remove from favourites
   */
  function handleAddToFavoritesClick(){
    //dispatch(bookFavoriteStateToggled(book.id));
  }

  
  let addToFavoritesButtonIconName = "add-to-favorites";
  if(book.isAddedToFavorites){
    addToFavoritesButtonIconName = "is-added-to-favorites";
  }

  return  (
    <div className="flex border-b-[1px] border-[grey] last:border-b-0">
      
      {/*custom checkbox for list item selecting for deletion*/}
      <div className="flex items-center pr-[15px]">
        <label>
          {/*make checkbox input invisible and not occupying space, add "peer" class to track checkbox checked/unckecked state in
          custom checkbox div*/}
          <input  type="checkbox" 
                  checked={isBookAddedToSelection}
                  onChange={handleBookSelectionForDeleting}
                  className="absolute opacity-0 peer"/>

          {/*create square with custom checkmark which is displayed or not depending on checkbox checked/unckecked state*/}
          <div className="block relative w-[18px] h-[18px] border-[2px] border-solid border-[#4066a5] rounded-[3px] 
            bg-white peer-checked:bg-[#ccc] after:hidden peer-checked:after:block peer-focus-visible:[outline-style:auto] 
            after:absolute after:left-[4px] after:top-0 after:w-[6px] after:h-[11px] after:border after:border-solid 
            after:border-[#4066a5] after:border-t-0 after:border-r-[2px] after:border-b-[2px] after:border-l-0 after:rotate-45">
          </div>
        </label>
      </div>

      {/*book author and title*/}
      <div className="grow shring basis-0 py-[15px]">
        <div className="author text-[0.8em]">{book.author}</div>
        <div className='title'>{book.title}</div>
      </div>
      
      <div className="grow-0 shrink-0 flex items-center gap-[10px] ml-[10px]">
        
        {/*add to favorites button*/}
        <ButtonWithIconAndBackground
          iconName = {addToFavoritesButtonIconName}
          clickHandler={handleAddToFavoritesClick}/>

        {/*edit button*/}
        <ButtonWithIconAndBackground
          iconName = "edit"
          //redirect to edit url on click
          clickHandler={()=>{navigate(editUrl)}}/>
        
        {/*delete button*/}
        <ButtonWithIconAndBackground
          iconName = "delete"
          //redirect to delete url on click
          clickHandler={()=>{navigate(deleteUrl)}}/>
      </div>
    </div>
  )
}
