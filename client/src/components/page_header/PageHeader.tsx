import AboutInfoPopupMenu from './AboutInfoPopupMenu';
import SearchBar from './SearchBar';

export function PageHeader(){
  return (
    <div className="px-[15px] py-[30px] sm:px-[30px] bg-[#c6c9ce]">
      <div className="wrapper flex gap-3.5 flex-wrap items-center relative z-[1000]">
        <AboutInfoPopupMenu/>
        <SearchBar/>
      </div>
    </div>
  )
}