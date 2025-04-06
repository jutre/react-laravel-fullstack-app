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
    <div className="px-[15px] py-[35px] pb-[30px] sm:px-[30px] bg-[#c6c9ce]">
      <div className="flex gap-3.5 flex-wrap items-center relative z-[1000]">
        <AboutInfoPopupMenu/>
        {isUserLoggenIn === true &&
          <SearchBar/>
        }
      </div>
    </div>
  )
}