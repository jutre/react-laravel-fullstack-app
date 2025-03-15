import {useState, useRef, useCallback} from 'react';
import { closeDivOnClickOutsideOfDiv } from '../../utils/utils';

function AboutInfoPopupMenu(){
  const [isMenuOpened, setIsMenuOpened] = useState(false);

  //for closing popup div by click on any element in document except menu itself 
  //we need to track the beginning of menu element
  const beginningOfMenuRef = useRef<HTMLDivElement>(null);

  //ref to window.document for adding click event listener when menu is opened and 
  //removing it when menu is closed (for performance issues don't use directly
  //document.addEventListener()/removeEventListener())
  const documentRef = useRef(document);


  /**
   * detect if we have clicked an element outside of menu and close it in such case.
   * 
   * Event listerner function is created using useCallback() hook. This is done to be able to remove
   * previously attached event handler when needeed as on each render of React component a defined  
   * function inside component, which is defined withous using useCallback() hook, is created as 
   * new function and such function won't be removed by a document.removeEventListener() call. 
   * Using useCallback() creates memorized function which can be later removed by removeEventListener() method.
   * @param {*} event 
   * @returns 
   */
  const hideInfoDivOnClickOutsideOfDiv = useCallback((event: MouseEvent)=>{
    
    //to close info div, we need to set state in component to false. Event attribute is not used
    const closeMenuAction = () =>{
      setIsMenuOpened(false)
    };

    closeDivOnClickOutsideOfDiv(event, beginningOfMenuRef, documentRef, hideInfoDivOnClickOutsideOfDiv, closeMenuAction)
  }, [])

  /**
   * toggles menu state variable to opposite; adds event handler to window.document 
   * when the menu is opened, removes that handler when menu is closed
   * 
   * @param {*} event 
   */
  function handleMenuToggle(){
    if(!isMenuOpened){
      setIsMenuOpened(true);
      documentRef.current.addEventListener('click', hideInfoDivOnClickOutsideOfDiv);
    }else{
      setIsMenuOpened(false);
      documentRef.current.removeEventListener('click',hideInfoDivOnClickOutsideOfDiv);
    }
  }


  function closeOpenedInfoDiv(){
    if(isMenuOpened){
      setIsMenuOpened(false);
      documentRef.current.removeEventListener('click',hideInfoDivOnClickOutsideOfDiv);
    }
  }

  //for applying same classes to multiple <li> elements store them in variable this way preventing code dublication
  let listItemClasses = "relative before:block before:absolute before:left-[-23px] before:top-[9px] before:bg-[#5f9ea0] before:w-[10px] before:h-[10px]";
  return (
    <div ref={beginningOfMenuRef}>

      {/*when info div is displayed it must be possible to hide it by clicking an area
      to the right from actuator tab horizontally. As this area technically is inside
      menu containing div where only actuator tab closes/opens info div, we need to add 
      an own click handler to div after tab because visually it is an area outside of
      actuator tab and info div and belongs to an area on which a click closes opened 
      info div*/}
      <div onClick={closeOpenedInfoDiv} className="absolute inset-0"></div>

      <button onClick={handleMenuToggle} 
          className={"relative z-[21] mb-[-1px] bg-[#83e6e6] border border-[grey] p-[15px] " +  
            /*when info pane opened, remove border under the tab
            //when tab becomes active, border under tab must disappear immediatelly because 
            //info div underneath is starting to appear and a tab must have common
            //unseparated background with div underneath, remove transition for border-bottom
            //disapper with delay that was needed while hiding active popupdiv */
            ( isMenuOpened
            ? "border-b-transparent transition-none" 
            : "[transition:border-color_0.1s_step-end]")}>
        About this app {/* this comment is for creating space between text and <span>*/}
        <span className={"inline-block w-[20px] h-[10px] relative after:absolute after:left-0 after:border-solid after:border-t-[10px] " +
                        "after:border-r-[10px] after:border-b-0 after:border-l-[10px] after:border-transparent after:border-t-neutral-600 " +
                        "after:transition-transform after:ease-linear after:delay-100" +
                        ( isMenuOpened 
                        ? " after:rotate-180"
                        : "")}></span>
      </button>

      <div className="flex overflow-hidden absolute z-[20]">
        <div className={"w-full p-[15px] bg-[#83e6e6] border border-slate-400 leading-[26px] " + ( isMenuOpened 
              ? "mb-0 max-h-[1000000px] visible [transition:margin-bottom_0.3s_cubic-bezier(0,0,0,1)]"
              : "mb-[-2000px] max-h-0 invisible [transition:margin-bottom_0.3s_cubic-bezier(1,0,1,1),visibility_0s_0.3s,max-height_0s_0.3s]")}>
                
          This app was created to get experience with Redux. Redux Toolkit is used, data is fetched from REST api using thunks. <br />
          Other technical features used:
          <ul className="pl-[30px]">
            <li className={listItemClasses}>React router</li>
            <li className={listItemClasses}>CSS used to create typical UI elements: popup menu, modal dialog, autocomplete search box,
              styled checkboxes, responsive design
            </li>
            <li className={listItemClasses}>a function created that lets easily generate HTML form by defining it's structure using
              array of objects</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AboutInfoPopupMenu;