import { routes } from "../config";
import { FilteredBooksListInitializer } from "./books_list/FilteredBooksListInitializer";
import { AllBooksList } from "./books_list/AllBooksList";
import { FavoriteBookList } from "./books_list/FavoriteBookList";
import { BookEditing } from "./BookEditing";
import { DemoDataReset } from "./DemoDataReset";
import {
    Routes,
    Route
} from "react-router-dom";
import { AuthenticatedRoute } from "./AuthenticatedRoute";
import { useAppDispatch, useAppSelector } from '../store/reduxHooks';
import { BookCreating } from "./BookCreating";
import { PageNotFound } from "./PageNotFound";
import { apiSlice, selectIsUserLoggenIn } from "../features/api/apiSlice";
import { ResourcesPreloader } from './ResourcesPreloader';
import { BooksListLoadingSketeton } from "./books_list/BooksListLoadingSketeton";

/**
 * Performs component routing using react-router API and some other things:
 * 
 * 1) returns component that matches defined route if user is authenticated or returns login form if user is not authenticated.
 * 2) while getting user authentification status displays loading skeleton
 * 3) initiates literary genres list loading as soon it is known that user is authenticated
 * 
 * @returns 
 */
export function RoutesSwitch() {
    const dispatch = useAppDispatch();

    // getting loading status and final result on whether user is logged in. If any other error response besides "HTTP 401 Unauthenticated"
    // is received also in that case login form will be displayed; if similar error like "HTTP 500" error will still be present after form
    // is submitted then login form will display that error
    const { isLoading: userDataInitialLoadStatus } = apiSlice.endpoints.getCurrentLoggedInUser.useQueryState()
    const isUserLoggenIn = useAppSelector(selectIsUserLoggenIn)

    if (userDataInitialLoadStatus === true) {
        return <BooksListLoadingSketeton />

        // now we know user whether user is authenticated or not
    } else {

        if (isUserLoggenIn) {
            //launch fetching literary genres list to be already loaded when user opens book creation or edit form
            dispatch(apiSlice.endpoints.getLiteraryGenres.initiate())
        }

        //display element matching to route if user is authenticated or login form if not authenticated
        return (
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
}