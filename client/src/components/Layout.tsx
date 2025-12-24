import { routes } from "../config";
import { FAVORITE_BOOKS_LIST } from "../constants/bookListModes";
import { PageHeader } from "./page_header/PageHeader";
import { BooksListTypeMenu } from "./BooksListTypeMenu";
import { BooksList } from "./books_list/BooksList";
import { BookEditing } from "./BookEditing";
import { DemoDataReset } from "./DemoDataReset";
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import { useAppDispatch, useAppSelector } from '../store/reduxHooks';
import { selectUserLoadingStatus, selectIsUserLoggenIn } from '../features/authSlice';
import { LoginForm } from "./LoginForm";
import { UserInfoAndLogoutControls } from "./UserInfoAndLogoutControls";
import { BookCreating } from "./BookCreating";
import { PageNotFound } from "./PageNotFound";
import { apiSlice } from "../features/api/apiSlice";
import { ResourcesPreloader } from './ResourcesPreloader';

/**
 * returns markup that creates layout structure (three columns beginning with larget tablet devices, one column on smaller tablet devices,
 * phones) and outputs menu, header and content parts. If user is authenticated displays all sections, if user is not logged in the
 * menu, search bar in header is hidden, login form is shown in content section
 * @returns
 */
const Layout = () => {
  const dispatch = useAppDispatch();

  const userDataInitialLoadStatus = useAppSelector(selectUserLoadingStatus)
  const isUserLoggenIn = useAppSelector(selectIsUserLoggenIn);


  let content: React.ReactNode;

  //waiting response of initial request to REST API on UI app initial display to find out whether a HTTP session of logged in user exists.
  //Displaying text message about pending status, not displaying login form yet as we don't know yet whether user is or not authenticated
  if (userDataInitialLoadStatus === "pending") {
    content = <div>User session check...</div>

  } else {
    if (isUserLoggenIn) {
      //User is authenticated

      //display component corresponding to current URL
      content =
        <Routes>
          <Route path={routes.bookListPath} element={<BooksList />} />
          <Route path={routes.favoriteBooksListPath} element={<BooksList listMode={FAVORITE_BOOKS_LIST} />} />
          <Route path={routes.bookEditPath} element={<BookEditing />} />
          <Route path={routes.createBookPath} element={<ResourcesPreloader><BookCreating /></ResourcesPreloader>} />
          <Route path={routes.demoDataResetPath} element={<DemoDataReset />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>

      //launch fetching literary genres list to be already loaded when user opens book creation or edit form
      dispatch(apiSlice.endpoints.getLiteraryGenres.initiate())

      //NOT authenticated. For each URL that in authenticated state have a corresponding component display login form, for unrecognized
      //paths display "Page not found" component
    } else {
      content =
        <Routes>
          {
            [routes.bookListPath,
            routes.favoriteBooksListPath,
            routes.bookEditPath,
            routes.createBookPath,
            routes.demoDataResetPath].map((path, index) =>
              <Route path={path} element={<LoginForm />} key={index} />
            )}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
    }
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
            {content}
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