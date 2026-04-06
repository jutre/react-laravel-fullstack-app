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
const Layout = () => {
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

    //display matching route if user is authenticated or login form component if unauthenticated
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

        {/*menu visible only when user is logged in.
        Located at page bottom on mobile devices, beginning with wider tablet screens on left side of content.
        On wider tablets fixed bottom position is cancelled in menu component but following div aligns menu in center and then on right
        side on itself depending of whole screen width*/}
        <div className="lg:grow lg:flex lg:justify-center xl:justify-end xl:shrink-0 xl:basis-0">
          {isUserLoggenIn === true &&
            <BooksListTypeMenu/>
          }
        </div>

        {/*main content section.
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

          {/*starting with wider tablet screens the footer is assigned non zero height,
          it becomes visible as menu is not located at page bottom any more*/}
          <div className="bg-gray-300 h-[0px] lg:h-[35px]"></div>
        </div>

        {/*left column visible on larger devices, has background*/}
        <div className="lg:grow lg:shrink xl:shrink-0 xl:basis-0"></div>

      </Router>
    </div>
  )
}
export default Layout;