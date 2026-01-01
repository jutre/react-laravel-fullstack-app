import BooksListParamProcessor from "./BooksListParamsProcessor";
import { BooksListBody } from "./BooksListBody";
import { BooksListHeadingAndTitleSelector } from "./BooksListHeadingAndTitleSelector";
import { CreateBookButton } from "../ui_elements/CreateBookButton";
import { BooksListModeParams } from '../../types/BooksListMode'

/**
 * 
 * @param listMode - indicates current mode books list is currently working in - all books list or favorites books list. Value is passed to
 * child components to do needed calculations for display data correspoding to books list mode
 */
export function BooksList({ listMode }: BooksListModeParams) {

  return  (
    <div className="relative">
      <BooksListHeadingAndTitleSelector listMode={listMode}/>

      {/*button for redirect to book creating page on top right corner on all books list, search result list but not on favorite books list.
      It keeps code simple as there is no need to manage two different values of "Back" link on book creating page. What matters the most is
      that there is no clear understanding what behaviour of "Back" link to implement - if user clicks "New book" on favorites list and
      immediately clicks "Back" link then page is redirected to favorites list; but if user saves new book data what URL should "Back" link
      point to - to new book creating page with empty form or to favorites list?*/}
      {listMode !=="FAVORITE_BOOKS_LIST" &&
        <CreateBookButton />
      }

      <BooksListParamProcessor listMode={listMode}/>
      <BooksListBody listMode={listMode}/>
    </div>
  )
}