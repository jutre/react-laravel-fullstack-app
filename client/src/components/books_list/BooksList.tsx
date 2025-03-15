import { useEffect } from "react";
import { routes } from "../../config";
import { FAVORITE_BOOKS_LIST } from "../../constants/bookListModes";
import BooksListParamProcessor from "./BooksListParamsProcessor";
import { BooksListBody } from "./BooksListBody";
import { setPageTitleTagValue } from "../../utils/setPageTitleTagValue";
import { H1Heading } from "../ui_elements/H1Heading";
import { AddBookLink } from "../ui_elements/AddBookLink";

export function BooksList({listMode = null}) {
  
  let listTitle;
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