import { routes } from "../../config.ts";
import { Link } from "react-router-dom";
import { BooksListBody } from "./BooksListBody.tsx";
import { useGetFilteredBooksListQuery } from '../../features/api/apiSlice.ts';
import { extractMessageFromQueryErrorObj } from '../../utils/utils.ts';
import { FILTERED_BOOKS_LIST } from "../../constants/bookListModes.ts";


/**
 * Fetches filtered books list from REST API and displays list items, loading state, errors, etc. in component creating books list HTML
 * markup. Also check search string length to be at least three symbols
 * 
 */

type FilteredBooksListProps = {
  filterString: string | null,
}

export function FilteredBooksList({ filterString }: FilteredBooksListProps) {

  // convert null filter string value to empty string to be able to do be able to call non empty string function on it. But the component
  // will not be rendered if filter string value is null as such value does not trigger filtered books list mode. The null value was added
  // to 'filterString' property union type to simlily code as in filter string value in Redux store can be null
  if (filterString === null) {
    filterString = ""
  }


  // if filter string length is less than three symbols books searching is not performed - do not execute query; 
  // set error message about too short filter string
  let errorMessage: string | undefined
  let isQueryExecutingSkippable = false
  if (filterString.length < 3) {
    isQueryExecutingSkippable = true
    errorMessage = "Searching string must contain at least three symbols"
  }

  const { currentData: listItems,
    error: booksListQueryError,
    isFetching: isFetching } = useGetFilteredBooksListQuery(
      {
        filterString: filterString
      },
      {
        skip: isQueryExecutingSkippable
      }
    )


  if (booksListQueryError) {
    errorMessage = extractMessageFromQueryErrorObj(booksListQueryError)
  }


  // if fetching process is done, no any errors then create message about found books amount or that no found books has been found
  let searchResultsInfoMessage = null
  if (isFetching === false &&
    listItems !== undefined &&
    booksListQueryError === undefined) {

    searchResultsInfoMessage = (
      <div className="mb-[15px]">
        <p>{`Your searched for "${filterString}".`}</p>
        <p>
          {listItems.length === 0
            ?
            "No books were found."
            :
            `Number of records found is ${listItems.length}.`
          }
        </p>
        <p><Link to={routes.bookListPath}>Show all books</Link></p>
      </div>
    )

  }

  return (
    <>
      <BooksListBody
        listMode={FILTERED_BOOKS_LIST}
        listItems={listItems}
        isFetchingData={isFetching}
        errorMessage={errorMessage}
        listHeader="Search books"
        searchedStringAndResultInfoMessage={searchResultsInfoMessage} 
        currentSearchString={filterString}/>
    </>
  )
}
