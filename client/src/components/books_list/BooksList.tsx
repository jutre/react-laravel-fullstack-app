import { routes } from "../../config";
import { useNavigate } from "react-router-dom";
import BooksListParamProcessor from "./BooksListParamsProcessor";
import { BooksListBody } from "./BooksListBody";
import { BooksListHeadingAndTitleSelector } from "./BooksListHeadingAndTitleSelector";
import { SquareButton } from '../ui_elements/SquareButton';
import { BooksListModeParams } from '../../types/BooksListMode'

/**
 * 
 * @param listMode - indicates current mode books list is currently working in - all books list or favorites books list. Value is passed to
 * child components to do needed calculations for display data correspoding to books list mode
 */
export function BooksList({ listMode }: BooksListModeParams) {
  
  const navigate = useNavigate();

  const addBookButtonContent = <><span className="mr-[7px]">+</span>Add book</>

  const redirectToBookCreatingPage = () => {navigate(routes.createBookPath)}

  return  (
    <div className="relative">
      <BooksListHeadingAndTitleSelector listMode={listMode}/>

      {/*button for redirect to book creating page on top right corner when not displaying favorite books - on empty favorites
      list a button "Add book" would be misleading letting him thing about adding book to favorites list*/}
      {listMode !=="FAVORITE_BOOKS_LIST" &&
        <SquareButton buttonContent={addBookButtonContent}
          clickHandler={redirectToBookCreatingPage}
          additionalTwcssClasses="absolute top-[-5px] right-0"/>
      }

      <BooksListParamProcessor listMode={listMode}/>
      <BooksListBody listMode={listMode}/>
    </div>
  )
}