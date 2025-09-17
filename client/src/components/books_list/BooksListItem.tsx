import { useAppDispatch, useAppSelector } from '../../store/reduxHooks';
import { useNavigate } from "react-router-dom";
//import { bookFavoriteStateToggled } from "../../features/favoriteBooksSlice";
import { 
  bookCollectionAddedToSelection, 
  singleBookRemovedFromSelection,
  selectIsBookAddedToSelection,
  selectIsBookAddedToFavoriteBooks } from "../../features/booksSlice";
import { ButtonWithIconAndBackground, IconNameValues } from '../ui_elements/ButtonWithIconAndBackground';
import { customCheckboxCheckmarkClasses, chekboxInputClasses } from '../../config'
import { Book } from '../../types/Book';

type BookListItemProps = {
  book: Book,
  editUrl: string,
  deleteUrl: string,
  addToFavoritesQueryTrigger: (bookId: number) => void,
  removeFromFavoritesQueryTrigger: (bookId: number) => void
}

export function BookListItem({book, editUrl, deleteUrl, addToFavoritesQueryTrigger, removeFromFavoritesQueryTrigger}: BookListItemProps) {
  //TODO maybe remove comment
  //button with redirection will be used instead of react router <Link/> element to have uniform styling - 
  //most of elements on page are html <button> elements, only couple of anchor <a/> elements might be needed on page
  //use <ButtonWithIcon/> component which generates <button> with click handler that redirects to needed url
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const isBookAddedToSelection = useAppSelector((state) => selectIsBookAddedToSelection(state, book.id));

  const isBookAddedToFavoriteBooks = useAppSelector((state) => selectIsBookAddedToFavoriteBooks(state, book.id));

  
  /**
   * handles checbox checking/unchecking event for a single book by adding or removing that book to selection for deleting.
   * Adds to deletable books selection when checkbox is checked and removes from selection if checbox is unchecked
   * @param {change event object} event 
   */
  function handleBookSelectionForDeleting(event: React.ChangeEvent<HTMLInputElement>){
    const isCheckboxChecked = event.target.checked;
    if(isCheckboxChecked){
      dispatch(bookCollectionAddedToSelection([book]));

    }else{
      dispatch(singleBookRemovedFromSelection(book));
    }
  }

  /**
   * when cliking on favourites icon, add or remove from favourites depending on whether book currently is added to favorites
   */
  function handleAddRemoveFromFavoritesClick(bookId: number, isCurrentlyAddedToFavorites: boolean){
    if(isCurrentlyAddedToFavorites){
      removeFromFavoritesQueryTrigger(bookId)

    }else{
      addToFavoritesQueryTrigger(bookId)
    }
  }

  
  let addToFavoritesButtonIconName: IconNameValues = "add-to-favorites";
  if(isBookAddedToFavoriteBooks){
    addToFavoritesButtonIconName = "is-added-to-favorites";
  }

  return  (
    <div className="flex border-b-[1px] border-[grey] last:border-b-0">
      
      {/*custom checkbox for list item selecting for deletion using Tailwindcss approach*/}
      <div className="flex items-center pr-[15px]">
        <label>
          <input  type="checkbox" 
                  checked={isBookAddedToSelection}
                  onChange={handleBookSelectionForDeleting}
                  //make checkbox input invisible and not occupying space, add "peer" class to track checkbox checked/unckecked state in
                  //custom checkbox div
                  className={chekboxInputClasses}/>

          {/*custom checkbox checked/unckecked state*/}
          <div className={customCheckboxCheckmarkClasses}>
          </div>
        </label>
      </div>

      {/*book author and title*/}
      <div className="grow shring basis-0 py-[15px]">
        <div className="author text-[0.8em]">{book.author}</div>
        <div className='title'>{book.title}</div>
      </div>
      
      <div className="grow-0 shrink-0 flex items-center gap-[10px] ml-[15px]">
        
        {/*add to favorites button*/}
        <ButtonWithIconAndBackground
          iconName = {addToFavoritesButtonIconName}
          clickHandler={()=>{handleAddRemoveFromFavoritesClick(book.id, isBookAddedToFavoriteBooks)}}/>

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
