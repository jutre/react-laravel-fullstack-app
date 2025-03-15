type ButtonWithIconProps = {
  clickHandler?: () => void,
  beforeElemMaskImgUrlTwCssClass: string,
  beforeElemMaskSizeTwCssClass: string,
  beforeElemBackgndColorTwCssClass?: string,
  otherClasses: string,
  buttonTypeAttrValue?: string
}

/**
 * Generates html markup with html <button> element with class attribute containing common Tailwind css classes to display
 * an icon in the center of a button. Is is achieved by creating ::before css pseudo element and placing it on the top of 
 * button element and placing svg image in the center using mask-* properties common of them are specified in component. When using
 * this component it is neccesary to pass additional Tailwind css classes using component properties which specify additional
 * css properties for ::before element: 
 * - svg file url (like beforeElemMaskImgUrlTwCssClass = "before:[mask-image:url(assets/svg_file.svg)]" )
 * - svg image size (like beforeElemMaskSizeTwCssClass = "before:[mask-size:20px]" )
 * - background color for svg element (like beforeElemBackgndColorTwCssClass = "before:bg-white" )
 * - any other needed Tailwind css classes which would add styling to <button> element itself or to ::before pseudo element,
 * like otherClasses = "bg-white hover:bg-red before:bg-[gray] before:hover:bg-[blue]" /> 
 * 
 * Other attributes are:
 * - click hander for button click event; if it's value is empty then function that does not perform anything is added as click handler.
 *  Intended for case when submit type button is required to be created, click handler is not usually needed in such case.
 * - value for specifying html <button> type attribute, if it's value is empty then attribute value is "button". Intended for case when
 * a submit type button is required to be created
 * 
 */
export function ButtonWithIcon({
  clickHandler,
  beforeElemMaskImgUrlTwCssClass,
  beforeElemMaskSizeTwCssClass,
  beforeElemBackgndColorTwCssClass,
  otherClasses,
  buttonTypeAttrValue
}: ButtonWithIconProps) {

  let buttonTwCssClasses =
    //create ::before element to cover parent button element
    "before:absolute  " +
    "before:left-0  " +
    "before:top-0 " +
    "before:block " +
    "before:w-full " +
    "before:h-full " +
    "before:z-[-10] " +
    //mask properties for ::before element
    beforeElemMaskImgUrlTwCssClass + " " +
    beforeElemMaskSizeTwCssClass + " " +
    "before:[mask-position:center] " +
    "before:[mask-repeat:no-repeat] ";

  if (beforeElemBackgndColorTwCssClass) {
    buttonTwCssClasses += beforeElemBackgndColorTwCssClass + " ";
  }

  buttonTwCssClasses += otherClasses;

  //button may also be a submit button which submits form when clicked, in such situation usually there will be no click handler
  //attached, also there may be situations when click handler is not attached (click event might be attached to parent element of
  //button). Therefore add click handler to button only when it is not empty, it is achieved using JS object that contains "onClick"
  //property only in case if handler is not empty
  let clickHandlerAttributeContainer: {onClick?:  () => void} = {}
  if (clickHandler) {
    clickHandlerAttributeContainer["onClick"] = clickHandler
  }

  if (!buttonTypeAttrValue) {
    buttonTypeAttrValue = "button"
  }

  return (
    <button type={buttonTypeAttrValue}
      className={buttonTwCssClasses}
      {...clickHandlerAttributeContainer}></button>
  )
}
