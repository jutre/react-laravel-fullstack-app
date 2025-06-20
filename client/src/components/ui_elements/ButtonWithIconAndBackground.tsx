import { ButtonWithIcon } from '../ui_elements/ButtonWithIcon';

/**
 * book edit, delete and adding/removing from favorites look same, differs only in icon file, such buttons are used in several screens.
 * To minimize code dublication current component is created.
 * 
 * @param {string} iconName - one of string values "is-added-to-favorites", "add-to-favorites", "delete", "edit", appropriate icon
 * file will be displayed 
 * @param {function} clickHandler - pointer to button click handler function
 * @param {boolean} buttonDisabled - if value is true then button visual appearance is disable elements appearance - color set similar to
 * gray color which is achieved by adding appropriate css class for background and default cursor (no pointer above button); no html
 * element's 'disabled' attritute is added, the click handler if passed is still invoked when button is clicked - in case when button
 * semantically is disabled, the absence of any action to click must be defined in attached click handler
 * @param {string} buttonTypeAttrValue -
 */

export type IconNameValues = 'is-added-to-favorites' | 'add-to-favorites' | 'delete' | 'edit'
type ButtonWithIconAndBackgroundProps = {
  iconName: IconNameValues
  clickHandler?: () => void,
  buttonDisabled?: boolean,
  buttonTypeAttrValue?: 'button' | 'submit'
}
export function ButtonWithIconAndBackground({iconName,
  clickHandler,
  buttonDisabled,
  buttonTypeAttrValue}: ButtonWithIconAndBackgroundProps) {

  //white background class is used for most of icons, set as default value
  let beforeElemBackgndColorTwCssClass = "before:bg-white";

  let beforeElemMaskImgUrlTwCssClass:string;
  switch (iconName) {
    case 'is-added-to-favorites':
      beforeElemMaskImgUrlTwCssClass = "before:[mask-image:url(assets/is-added-to-favorites-flag.svg)]";
      beforeElemBackgndColorTwCssClass = "before:bg-black";
      break;
    case 'add-to-favorites':
      beforeElemMaskImgUrlTwCssClass = "before:[mask-image:url(assets/add-to-favourites-flag.svg)]";
      break;
    case 'delete':
      beforeElemMaskImgUrlTwCssClass = "before:[mask-image:url(assets/delete.svg)]";
      break;
    case 'edit':
      beforeElemMaskImgUrlTwCssClass = "before:[mask-image:url(assets/edit.svg)]";
      break;
  }

  //common classes specify rounded background, size, z-index (must be stacked above ::before pseudo element)
  //created in ButtonWithIcon component
  let commonClasses = "border-0 rounded-full w-[35px] h-[35px] relative z-[20] ";
  //if button is disabled, it's background is gray, does not change on hover, has default cursor. 
  //If not disabled, it's background is blue, changes on hover, has point cursor inherited from html button styling
  if(buttonDisabled){
    commonClasses += "bg-[#ccc] cursor-default";
  }else{
    commonClasses += "bg-[#46aae9] hover:bg-[#0076c0]";
  }
  
  return (
    <ButtonWithIcon
      clickHandler = {clickHandler}
      beforeElemMaskImgUrlTwCssClass = {beforeElemMaskImgUrlTwCssClass}
      beforeElemMaskSizeTwCssClass = "before:[mask-size:20px]"
      beforeElemBackgndColorTwCssClass = {beforeElemBackgndColorTwCssClass}
      otherClasses= {commonClasses} 
      buttonTypeAttrValue = {buttonTypeAttrValue}/>
  )
}
