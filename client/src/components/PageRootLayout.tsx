import { PageHeader } from "./page_header/PageHeader"
import { BooksListTypeMenu } from "./BooksListTypeMenu"
import {
  BrowserRouter as Router,
} from "react-router-dom"
import { RoutesSwitch } from "./RoutesSwitch"
import { useAppSelector } from '../store/reduxHooks'
import { UserInfoAndLogoutControls } from "./UserInfoAndLogoutControls"
import { selectIsUserLoggenIn } from "../features/api/apiSlice"

/**
 * Returns markup that creates layout structure (one column on smaller screems, three columns beginning with larger tablets)
 * and outputs menu, header and content parts; hiding some on them if user is not authenticated.
 * @returns
 */
export function PageRootLayout () {

  //getting loading status and final result on whether user is logged in. If any other error besides "HTTP 401 Unauthenticated"
  //occurs like "HTTP 500 Internal Server Error" the login form will be displayed; if same error will still be present the login form will
  //display it when submitting it
  const isUserLoggenIn = useAppSelector(selectIsUserLoggenIn)

  
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

          {/*logout controls at top right of page*/
            isUserLoggenIn === true &&
            <div className="absolute top-[10px] right-[15px] sm:right-[30px] md:right-[15px] z-[1100]">
              <UserInfoAndLogoutControls />
            </div>
          }


          {/*content - components conforming to page URL or login form*/}
          <div className="bg-white relative pt-[30px] px-[15px] pb-[65px] xl:pb-[30px] sm:px-[30px] grow">
            <RoutesSwitch/>
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
