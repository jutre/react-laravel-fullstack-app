/*
 buttonTypeAttrValue two possible values 'button' and 'submit' in type are enough for all use cases and makes possible <button> tag 
 implementantation to comply with ESLint rule "react/button-has-type - The button type attribute must be specified by a static string or a
 trivial ternary expression"
*/
type ButtonWithIconProps = {
  beforeElemMaskImgUrlTwCssClass: string,
  beforeElemMaskSizeTwCssClass: string,
  beforeElemBackgndColorTwCssClass?: string,
  otherClasses: string,
  buttonTypeAttrValue?: 'button' | 'submit',
  clickHandler?: () => void,
}

/**
 * Generates html markup with html <button> element with class attribute containing common Tailwind css classes to display
 * an icon in the center of a button. Is is achieved by creating ::before css pseudo element and placing it on the top of 
 * button element and placing svg image in the center using mask-* properties common of them are specified in component. When using
 * this component it is neccesary to pass additional Tailwind css classes using component properties which specify additional
 * css properties for ::before element.
 * 
 * @param beforeElemMaskImgUrlTwCssClass - svg file url 
 * (like beforeElemMaskImgUrlTwCssClass = "before:[mask-image:url(assets/svg_file.svg)]")
 * @param beforeElemMaskSizeTwCssClass - svg image size like beforeElemMaskSizeTwCssClass = "before:[mask-size:20px]"
 * @param beforeElemBackgndColorTwCssClass - background color for svg element like beforeElemBackgndColorTwCssClass = "before:bg-white"
 * @param otherClasses - any other needed Tailwind css classes which would add styling to <button> element itself or to ::before pseudo
 * element, like otherClasses = "bg-white hover:bg-red before:bg-[gray] before:hover:bg-[blue]" />
 * @param buttonTypeAttrValue - lets set <button> type attribute to 'button' or 'submit. Parameter values can be whether 'button' or
 * 'submit', defaults to 'button' if property value is not provided. Two allowed values are enough for all use cases and makes possible
 * <button> tag implementantation to comply with ESLint rule "react/button-has-type - The button type attribute must be specified by a
 * static string or a trivial ternary expression"
 * @param clickHandler - optional click handler for <button>
 * 
 */
export function ButtonWithIcon({
  beforeElemMaskImgUrlTwCssClass,
  beforeElemMaskSizeTwCssClass,
  beforeElemBackgndColorTwCssClass,
  otherClasses,
  buttonTypeAttrValue,
  clickHandler
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
  const clickHandlerAttributeContainer: {onClick?:  () => void} = {}
  if (clickHandler) {
    clickHandlerAttributeContainer["onClick"] = clickHandler
  }

  if (!buttonTypeAttrValue) {
    buttonTypeAttrValue = "button"
  }

  return (
    <button type={(buttonTypeAttrValue === 'submit') ? 'submit' : "button"}
      className={buttonTwCssClasses}
      {...clickHandlerAttributeContainer}></button>
  )
}
