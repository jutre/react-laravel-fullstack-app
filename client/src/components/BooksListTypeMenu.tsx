
import { useState } from 'react';
import { NavLink } from "react-router-dom";
import { routes } from "../config";
import { useResponsiveJSX } from "../hooks/useResponsiveBreakpoints";
import { ButtonWithIcon } from './ui_elements/ButtonWithIcon';

/**
 * returns markup with menu containing two links: to all books list and to favorite book list, assigns a dedicated
 * active css class name to a menu entry if menu url is equal with current page's url
 */

export function BooksListTypeMenu () {

  const menuEntries = [
    {linkText: "All books", url: routes.bookListPath},
    {linkText: "Favorite books", url: routes.favoriteBooksListPath},
    {linkText: "Demo data reset", url: routes.demoDataResetPath}
  ];


  /**
   * Returns Tailwind css classes for top level parent menu element.
   * 
   * When menu is displayed fullscreen (by activating using icon on phone screen), return css classes that assigns fixed position at page 
   * top and height of whole screen height.
   * 
   * When menu is not displayed as fullscreen menu, return css classes that shape responsive mode assigning fixed position at the bottom of
   * page on phone and tablet and screens; assigns static position to be positioned inside it's parent element on laptop and larger screens.
   * 
   * 
   */
  const getMenuContainerClassName = (displayFullscreen: boolean) => {
    if (displayFullscreen) {
      return "fixed top-0 w-full z-[2000] h-screen bg-white p-[20px] pt-[80px]";
    } else {
      return "fixed bottom-0 w-full z-[2000] lg:static lg:bottom-[unset] lg:w-auto";
    }
  }


  /**
   * Returns Tailwind css classes for element containing menu items.
   * 
   * When menu is displayed fullscreen (by activating using icon on phone screen), return classe that assigns display:block to align menu
   * items each below previous
   * 
   * When menu is not displayed as fullscreen menu, return css classes that shape responsive mode assigning display:flex to place menu items
   * in one row on phone and tablet and screens; assigns display:block on laptop and larger screens to align menu items each below previous
   * 
   */
  const getMenuItemsWrapperClassName = (displayFullscreen: boolean) => {
    if (displayFullscreen) {
      return "block";
    } else {
      return "flex justify-evenly py-[15px] bg-white border-t-2 border-black lg:pt-[132px] lg:block lg:border-t-0 lg:bg-transparent " +
        "xl:pr-[30px]";
    }
  }

  /**
   * Returns Tailwind css classes for react-router-dom <NavLink> className attribute creating different styling for smaller and larger
   * screens and highlighting active menu entry - menu item is highlighted using background if it's URL is same as current page URL
   * and it is not third menu item (index = 2) on phone device (breakpointIndex = 0). Phone devices has third item as "Menu" icon and
   * must be not highlighted, it is action button to display all menu entries in fullscreen mode
   * 
   * Using <NavLink> as react-router-dom <Link> component does not allow to add className attribute
   */
  const getNavLinkClassName = (isActive: boolean, isDisplayedFullscreen: boolean) => {
    let anchorClasses = "block px-[10px] py-[5px] border rounded-lg border-black font-bold  hover:text-[black] lg:border-0 lg:p-[10px] " +
      "lg:pr-[15px]";
    if ( isDisplayedFullscreen) {
      anchorClasses += " mb-[20px] text-center";
    }
    if (isActive && !isDisplayedFullscreen) {
      return anchorClasses + " bg-gray-300";
    } else {
      return anchorClasses;
    }
  }

  /**
   * sets state to display fullscreen menu
   */
  function displayFullscreenMenuClick(){
    setIsFullscreenMenuActive(true);
  }

  /**
   * sets state to hide fullscreen menu
   */
  function hideFullscreenMenuClick(){
    setIsFullscreenMenuActive(false);
  }


  const [isFullscreenMenuActive, setIsFullscreenMenuActive] = useState(false);
  
  //we only care distinguishing whenther is is phone screen or any larger
  const breakpointIndex = useResponsiveJSX([600])

  return (
    <div className={getMenuContainerClassName(isFullscreenMenuActive)}>

      {//menu hiding button above at top right corner of fullscreen menu
      isFullscreenMenuActive &&
        <ButtonWithIcon
          clickHandler={hideFullscreenMenuClick}
          beforeElemMaskImgUrlTwCssClass="before:[mask-image:url(assets/clear-form.svg)]"
          beforeElemMaskSizeTwCssClass="before:[mask-size:20px]"
          beforeElemBackgndColorTwCssClass="before:bg-red-500"
          otherClasses="w-[36px] h-[36px] absolute right-[15px] top-[15px]" />
      }

      <div className={getMenuItemsWrapperClassName(isFullscreenMenuActive)}>
        {(menuEntries).map((entry, index) => {

          const isThisThirdMenuPositionOnPhoneScreen = index === 2 && breakpointIndex === 0;

          return (
            <div className="lg:text-left"
              key={index}>

              {isThisThirdMenuPositionOnPhoneScreen &&
                isFullscreenMenuActive === false
                ?
                // if this is third menu item on phone width screen and menu is "minimized" then display "Open fullscreen menu" icon
                // instead of menu entry which is link to page
                <ButtonWithIcon
                  clickHandler={displayFullscreenMenuClick}
                  beforeElemMaskImgUrlTwCssClass="before:[mask-image:url(assets/menu.svg)]"
                  beforeElemMaskSizeTwCssClass="before:[mask-size:31px]"
                  beforeElemBackgndColorTwCssClass="before:bg-black"
                  otherClasses="w-[31px] h-[31px] relative z-[20]" />

                :
                // in all other cases (wider than phone screen, menu in fullscreen mode on phone screen) display
                // link to page in all positions
                <NavLink to={entry.url}
                  className={({ isActive }) => getNavLinkClassName(isActive, isFullscreenMenuActive)}

                  //in fullscreen menu mode every link click should also hide fullscreen menu as page is navigated to target URL
                  onClick={isFullscreenMenuActive ? hideFullscreenMenuClick : () => { }}>

                  {/*span inside link needed to scale only text inside link on hover*/}
                  <span className={"whitespace-nowrap block lg:hover:transition-transform lg:hover:duration-200 " +
                    "lg:hover:ease-linear lg:hover:scale-[1.08] lg:hover:origin-top-left"}>
                    {entry.linkText}
                  </span>

                </NavLink>
              }
            </div>
          )}
        )}
      </div>
    </div>
  )
}