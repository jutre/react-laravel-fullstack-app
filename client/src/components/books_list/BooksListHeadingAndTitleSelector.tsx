import { useEffect } from "react";
import { BooksListModeParams } from '../../types/BooksListMode'
import { selectSearchString } from "../../features/booksSlice";
import { useAppSelector } from "../../store/reduxHooks";
import { getCurrentListMode } from "./BooksListBody";
import { setPageTitleTagValue } from "../../utils/setPageTitleTagValue";
import { H1Heading } from "../ui_elements/H1Heading";

/**
 * Calcurates books list heading depending on books list mode and search string value in Redux store: for all books list, filtered books
 * list or favorite books list; calculated heading is returned as HTML markup wrapped in heading tag and set to page's <title> tag.
 * 
 * Title calculation is done in separate component is part of optimisation preventing unnecessary re-renders (see comments of
 * BooksListParamProcessor.tsx component). Current component is re-rendered in all books list mode changes to filtering list mode depending
 * if search string value is set to Redux store by other separate component (see
 *  that processed URL query parameters. to prevent;
 * 
 * @param listMode - used to determines list data type and select appripriate heading
 * 
 */
export function BooksListHeadingAndTitleSelector({ listMode }: BooksListModeParams) {
    const currentSearchString = useAppSelector(state => selectSearchString(state));
    
    const currentlyDisplayedList = getCurrentListMode(listMode, currentSearchString);

    let listTitle: string;
    if(currentlyDisplayedList === 'all_books_list'){
        listTitle = "All books";
    }else if(currentlyDisplayedList === 'favorites_list'){
        listTitle = "Favorite books";
    }else{
        listTitle = "Search books";
    }

    useEffect(() => {
        setPageTitleTagValue(listTitle);
    }, [listTitle]);

    return (
        <H1Heading headingText={listTitle}/>
    )
}