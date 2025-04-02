import { useEffect } from "react";
import { routes } from "../../config";
import { FAVORITE_BOOKS_LIST } from "../../constants/bookListModes";
import BooksListParamProcessor from "./BooksListParamsProcessor";
import { BooksListBody } from "./BooksListBody";
import { setPageTitleTagValue } from "../../utils/setPageTitleTagValue";
import { H1Heading } from "../ui_elements/H1Heading";
import { AddBookLink } from "../ui_elements/AddBookLink";
import { BooksListModeParams } from '../../types/BooksListMode'

/**
 * 
 * @param listMode - indicates current mode books list is currently working in - all books list or favorites books list. Value is passed to
 * child components to do needed calculations for display data correspoding to books list mode
 */
export function BooksList({ listMode }: BooksListModeParams) {
  
  let listTitle: string;
  if(listMode === FAVORITE_BOOKS_LIST){
    listTitle = "Favorite books";
  }else{
    listTitle = "All books";
  }

  useEffect(() => {
    setPageTitleTagValue(listTitle);
  }, [listTitle]);

  return  (
    <div className="relative">
      <H1Heading headingText={listTitle}/>
      <div className="absolute top-0 right-0">
        <AddBookLink url={routes.createBookPath} linkText="Add book"/>
      </div>
      <BooksListParamProcessor listMode={listMode}/>
      <BooksListBody listMode={listMode}/>
    </div>
  )
}