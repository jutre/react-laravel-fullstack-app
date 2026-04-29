import { routes } from "../config";
import { PageHeader } from "./page_header/PageHeader";
import { BooksListTypeMenu } from "./BooksListTypeMenu";
import { FilteredBooksListInitializer } from "./books_list/FilteredBooksListInitializer";
import { AllBooksList } from "./books_list/AllBooksList";
import { FavoriteBookList } from "./books_list/FavoriteBookList";
import { BookEditing } from "./BookEditing";
import { DemoDataReset } from "./DemoDataReset";
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import { AuthenticatedRoute } from "./AuthenticatedRoute";
import { useAppDispatch, useAppSelector } from '../store/reduxHooks';
import { UserInfoAndLogoutControls } from "./UserInfoAndLogoutControls";
import { BookCreating } from "./BookCreating";
import { PageNotFound } from "./PageNotFound";
import { apiSlice, selectIsUserLoggenIn } from "../features/api/apiSlice";
import { ResourcesPreloader } from './ResourcesPreloader';
import { BooksListLoadingSketeton } from "./books_list/BooksListLoadingSketeton";

/**
 * returns markup that creates layout structure (three columns beginning with larget tablet devices, one column on smaller tablet devices,
 * phones) and outputs menu, header and content parts. If user is authenticated displays all sections, if user is not logged in the
 * menu, search bar in header is hidden, login form is shown in content section
 * @returns
 */
export function PageRootLayout () {
  const dispatch = useAppDispatch();

  //getting loading status and final result on whether user is logged in. If any other error besides "HTTP 401 Unauthenticated"
  //occurs like "HTTP 500 Internal Server Error" the login form will be displayed; if same error will still be present the login form will
  //display it when submitting it
  const { isLoading: userDataInitialLoadStatus } = apiSlice.endpoints.getCurrentLoggedInUser.useQueryState()
  const isUserLoggenIn = useAppSelector(selectIsUserLoggenIn)


  let mainContent: React.ReactNode;

  // we don't know yet whether user is authenticated or not, display skeleton while waiting response from REST API with information whether
  // HTTP session of authenticated user exists
  if (userDataInitialLoadStatus === true) {
    mainContent = <BooksListLoadingSketeton />

  // now we know user whether user is authenticated or not
  } else {

    if (isUserLoggenIn) {
      //launch fetching literary genres list to be already loaded when user opens book creation or edit form
      dispatch(apiSlice.endpoints.getLiteraryGenres.initiate())
    }

    //display element matching to route if user is authenticated or login form if not authenticated
    mainContent = (
      <Routes>
        <Route element={<AuthenticatedRoute isAuthenticated={isUserLoggenIn} />}>
          <Route path={routes.bookListPath} element={<AllBooksList />} />

          <Route path={routes.filteredBookListPath} element={<FilteredBooksListInitializer />} />

          <Route path={routes.favoriteBooksListPath} element={<FavoriteBookList />} />

          <Route path={routes.bookEditPath}
            element={
              <ResourcesPreloader>
                <BookEditing />
              </ResourcesPreloader>
            } />

          <Route path={routes.createBookPath}
            element={
              <ResourcesPreloader>
                <BookCreating />
              </ResourcesPreloader>
            } />

          <Route path={routes.demoDataResetPath} element={<DemoDataReset />} />
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    )
  }
  
  return (
    <div className="bg-[#eeeeee] flex min-h-screen">
      <Router>

        {/* Menu visible only when user is logged in.
        Located at page bottom on mobile devices, beginning with tablet screens on the left side relative to center column.
        On tablets fixed bottom position is cancelled by menu component's class change but current div classes aligns menu in center and on
        wider screens on right side on flex container */}
        <div className="lg:grow lg:flex lg:justify-center xl:justify-end xl:shrink-0 xl:basis-0">
          {isUserLoggenIn === true &&
            <BooksListTypeMenu/>
          }
        </div>


        {/* Main content section.
        On largest devices in center between two equal width side columns, on medium devices
        between two different width columns, on smaller occupies whole screen width*/}
        <div className="grow lg:grow-0 lg:shrink-0 lg:basis-[840px] xl:basis-[950px] flex flex-col relative">
          <PageHeader isUserLoggenIn={isUserLoggenIn}/>

          {/*logout controls at top right of page*/}
          {isUserLoggenIn === true &&
            <div className="absolute top-[10px] right-[15px] sm:right-[30px] md:right-[15px] z-[1100]">
              <UserInfoAndLogoutControls/>
            </div>
          }


          {/*content - book lists or login form*/}
          <div className="bg-white relative pt-[30px] px-[15px] pb-[65px] xl:pb-[30px] sm:px-[30px] grow">
            {mainContent}
          </div>


          {/* beginning with wider screens the footer in the bottom of central column is assigned non zero height and is visible as footer
          line with background */}
          <div className="bg-gray-300 h-[0px] lg:h-[35px]"></div>
        </div>


        {/*left column visible on larger devices, has background*/}
        <div className="lg:grow lg:shrink xl:shrink-0 xl:basis-0"></div>

      </Router>
    </div>
  )
}
