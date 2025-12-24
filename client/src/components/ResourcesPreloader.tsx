import { PropsWithChildren } from "react"
import { apiSlice } from "../features/api/apiSlice"
import { extractMessageFromQueryErrorObj } from "../utils/utils"
import { GeneralErrorMessage } from "./ui_elements/GeneralErrorMessage"
import { BookFormSketeton } from "./BookFormSketeton"

/**
 * Displays fetching indicator and prevents child components rendering while literary genres list fetching is in progress. 
 * Only when fetching is done the children components are outputs as those components expect the literary genres list already to be loaded.
 * Using current component makes code of child components much simplier as they don't need to maintain loading/error states of literary
 * genres in addition to loading/error states state of primary resource. As an example, in book editing page primary resource to be loaded
 * is editable book but literary genre is used to create options list in 'select' input element.
 * 
 * Literary genres list fetching is initiated immediatelly when app is opened first time and user is already authenticated or immediatelly
 * after login form submit with correct credentials if user was not authenticated. If page route conforms to component that uses literary
 * genres list (book creating, editing) that component must be wrapped in ResourcesPreloader component which displays fetching indicator
 * while genres list is loading. If first page user opens is index page with books list where genres list is not used then
 * ResourcesPreloader is not needed, the literary genres list is loaded in the background without any indication
 * 
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
