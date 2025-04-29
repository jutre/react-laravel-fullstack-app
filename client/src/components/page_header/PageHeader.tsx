import AboutInfoPopupMenu from './AboutInfoPopupMenu';
import SearchBar from './SearchBar';

type PageHeaderProps = {
  isUserLoggenIn: boolean
}

/**
 * creates page header displaying 'About' dropdown info panel and, if isUserLoggenIn property is true, displays quick search bar
 * @param isUserLoggenIn 
 * @returns 
 */
export function PageHeader( {isUserLoggenIn}: PageHeaderProps){
  return (
    //first div padding top is adjusted on smallest phone size screen, medium phone screen, tablet breakpoints as location of "About button"
    //and searchbar changes radically on those breakpoints.
    //Gap becomes zero starting from minwidth=800px as search bar on this width places input field in center, the space on left that was
    //created by gap must be removed to place input bar visually on center
    <div className="px-[15px] py-[50px] sm:pt-[30px] md:pt-[60px] pb-[30px] sm:px-[30px] bg-gray-300">
      <div className="flex gap-[30px] min-[800px]:gap-0 flex-wrap items-center relative z-[1000]">
        <AboutInfoPopupMenu/>
        {isUserLoggenIn === true &&
          <SearchBar/>
        }
      </div>
    </div>
  )
}