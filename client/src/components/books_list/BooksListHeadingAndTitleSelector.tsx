import { useEffect } from "react";
import { BooksListModeParams } from '../../types/BooksListMode'
import { selectSearchString } from "../../features/booksSlice";
import { useAppSelector } from "../../store/reduxHooks";
import { getCurrentListMode } from "./BooksListBody";
import { setPageTitleTagValue } from "../../utils/setPageTitleTagValue";
import { H1Heading } from "../ui_elements/H1Heading";

/**
 * Outputs the title of books list depending on current books list mode in heading (<h1>) tag and sets title to page's <title> tag. 
 * 
 * @param listMode - determines primary books list type
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