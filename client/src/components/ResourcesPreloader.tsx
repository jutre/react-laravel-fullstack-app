import { PropsWithChildren } from "react"
import { apiSlice } from "../features/api/apiSlice"
import { extractMessageFromQueryErrorObj } from "../utils/utils"
import { GeneralErrorMessage } from "./ui_elements/GeneralErrorMessage"
import { BookFormSketeton } from "./BookFormSketeton"

/**
 * Displays fetching indicator and prevents child components rendering while literary genres list fetching is in progress. 
 * Only when fetching is done the children components are output as children components expect literary genres list already to be loaded.
 * Using current component makes code of child components simplier as they don't need to maintain loading/error states of literary
 * genres in addition to loading/error state of primary resource.
 * Book creating, editing component must be wrapped in ResourcesPreloader component as literary genres list is used to create options list
 * in 'select' input element.
 * 
 * Literary genres list fetching is initiated as soon as it is detected that user is authenticated (first app run with existing session or
 * after sucessful login.
 */
export function ResourcesPreloader({ children }: PropsWithChildren) {

  const { error: literaryGenresQueryError,
    isFetching: isFetchingGetLiteraryGenresList } = apiSlice.endpoints.getLiteraryGenres.useQueryState()

  let errorMsg: string | null = null

  //when fetching literary genres is done check if query error has occured
  if (isFetchingGetLiteraryGenresList === false) {
    if(literaryGenresQueryError){
      errorMsg = extractMessageFromQueryErrorObj(literaryGenresQueryError)
    }
  }


  //while loading don't output child component
  if(isFetchingGetLiteraryGenresList === true){
      return <BookFormSketeton/>
    
  }else if(errorMsg){
    return <GeneralErrorMessage msgText={errorMsg} /> 
  }

  //resouces loaded, output child components
  return children
  
}
