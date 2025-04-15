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

import { useAppSelector, useAppDispatch } from '../store/reduxHooks';
import { selectUserLoadingStatus, selectIsUserLoggenIn } from '../features/authSlice';
import { LoginForm } from "./LoginForm";
import { UserInfoAndLogoutControls } from "./UserInfoAndLogoutControls";
import { apiSlice } from "../features/api/apiSlice";
import { BookCreating } from "./BookCreating";


const Layout = () => {
  const userDataInitialLoadStatus = useAppSelector(selectUserLoadingStatus)
  const isUserLoggenIn = useAppSelector(selectIsUserLoggenIn);

  //--for sess timeout test
  const dispatch = useAppDispatch();

  function sendGetUserFromLaravelRequest() {
    dispatch(apiSlice.endpoints.getCurrentLoggedInUser.initiate(undefined, { forceRefetch: true }))
  }
  //--for sess timeout test



  let content: React.ReactNode;

  if (userDataInitialLoadStatus === "pending") {
    content = <div>User session check...</div>

  } else {
    if (isUserLoggenIn) {
      content =
      <Routes>
        <Route path={routes.bookListPath} element={<BooksList />} />
        <Route path={routes.favoriteBooksListPath} element={<BooksList listMode={FAVORITE_BOOKS_LIST} />} />
        <Route path={routes.bookEditPath} element={<BookEditing />} />
        <Route path={routes.createBookPath} element={<BookCreating />} />
        <Route path={routes.demoDataResetPath} element={<DemoDataReset />} />
      </Routes>

    } else {
      content = <LoginForm />
    }
  }
  
  return (
    <div className="bg-[#eeeeee] flex min-h-screen">
      <Router>

        <div className="lg:grow lg:flex lg:justify-center xl:justify-end xl:shrink-0 xl:basis-0">
          {isUserLoggenIn === true &&
            <BooksListTypeMenu/>
          }
        </div>
        <div className="grow lg:grow-0 lg:shrink-0 lg:basis-[840px] xl:basis-[950px] flex flex-col relative">
          <PageHeader isUserLoggenIn={isUserLoggenIn}/>
          {isUserLoggenIn === true &&
            <div className="absolute top-[10px] right-[15px] sm:right-[30px] md:right-[15px] z-[1100]">
              <UserInfoAndLogoutControls/>
            </div>
          }
          <div className="bg-white relative pt-[30px] px-[15px] pb-[65px] sm:px-[30px] grow">
            {content}
          </div>

          <div onClick={sendGetUserFromLaravelRequest}>On click request to api (for testing auth response)</div>
        </div>
        <div className="lg:grow lg:shrink xl:shrink-0 xl:basis-0"></div>
      </Router>
    </div>
  )
}
export default Layout;