import { routes } from "../../config.ts";
import { Link } from "react-router-dom";
import { BooksListBody } from "./BooksListBody.tsx";
import { useGetBooksListQuery } from '../../features/api/apiSlice.ts';
import { extractMessageFromQueryErrorObj } from '../../utils/utils.ts';


/**
 * Fetches all books list from REST API and displays list items, loading state, errors, etc. in component creating books list HTML markup
 * 
 */

export function AllBooksList() {

  const { data: booksListQueryData,
    error: booksListQueryError,
    isFetching: isFetching } = useGetBooksListQuery()


  let errorMsgFromEndpoint: string | undefined
  if (booksListQueryError) {
    errorMsgFromEndpoint = extractMessageFromQueryErrorObj(booksListQueryError)
  }


  let messageWhenBooksListIsEmpty = (
    <p>
      <strong>Books list is empty.</strong> <br /><br />
      Books can be added manually using form on <Link to={routes.createBookPath}>&quot;Add book&quot;</Link> page or created
      automatically on <Link to={routes.demoDataResetPath}>&quot;Demo data reset&quot;</Link> page.
      &quot;Demo data reset&quot; page lets create demo data with ten book records.
    </p>
  )


  return (
    <>
      <BooksListBody
        listBaseUrl={routes.bookListPath}
        listItems={booksListQueryData}
        isFetchingData={isFetching}
        errorMessage={errorMsgFromEndpoint}
        listHeader="All books"
        messageWhenBooksListIsEmpty={messageWhenBooksListIsEmpty} />
    </>
  )
}
