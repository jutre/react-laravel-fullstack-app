/**
 * returns markup with menu containing two links: to all books list and to favorite book list, assigns a dedicated
 * active css class name to a menu entry if menu url is equal with current page's url
 */
import { NavLink } from "react-router-dom";
import { routes } from "../config";


export function BooksListTypeMenu () {
  let menuEntries = [
    {linkText: "All books", url: routes.bookListPath},
    {linkText: "Favorite books", url: routes.favoriteBooksListPath}
  ];

  
  /**
   * React router dom <Link> element does not allow to add className attribute to generaded html anchor tag,
   * NavLink does. Function that returns classes for anchor tags in menu, the tag that corresponds to current
   * browser's url has class that adds additional background, function is to be passed ar <NavLink> className
   * prop value
   * TODO - specify color that conforms with initial design, currently it is similar to in 
   */
  const navLinkClassNameCalculator = (isActive: boolean) => {
    let anchorClasses = "block px-[10px] py-[5px] border rounded-lg border-black font-bold  hover:text-[#959595] lg:border-0 lg:p-[10px] lg:pr-[15px]";
    if (isActive) {
      return anchorClasses + " bg-[#c6c9ce]";
    } else {
      return anchorClasses;
    }
  }
  
  return (
    <div className="fixed bottom-0 w-full z-[100] lg:static lg:bottom-[unset] lg:w-auto">
      <div className="flex py-[15px] bg-white border-t-2 border-black lg:pt-[110px] lg:block lg:w-[unset] lg:border-t-0 lg:bg-transparent 
            xl:pr-[30px]">
        {(menuEntries).map((entry, index) =>
          <div key={index}
            className="grow-0 basis-1/2 flex justify-center lg:block lg:text-left">
            <NavLink to={entry.url}
              className={({ isActive }) => navLinkClassNameCalculator(isActive)}>
              <span className="lg:hover:block lg:hover:transition-transform lg:hover:duration-200 lg:hover:ease-linear lg:hover:scale-[1.08] 
                      lg:hover:origin-top-left">
                {entry.linkText}
              </span>
            </NavLink>
          </div>
        )}
      </div>
    </div>
  )
}