type SquareButtonProps = {
  buttonContent: React.ReactNode,
  clickHandler?: () => void,
  additionalTwcssClasses?: string,
  disabled?: boolean
}
/**
 * Square blue button appears on multiple pages with different text but with same styling (padding, background, hover color ) like 
 * "Add book" button, "Logout" button. 
 *  
 * @param buttonContent - text or React node (html tags, React Fragment tag) that will be placed as <button> element content 
 * @param clickHandler - optional click handler that performs some action when button clicked
 * @param additionalTwcssClasses - some additional valid Tailwind css classes f.e, adding margins, width
 * @param disabled - boolean attribute, if present and equals to true then button is disabled
 * 
 */
export function SquareButton({buttonContent, clickHandler, additionalTwcssClasses, disabled}: SquareButtonProps) {
  //add optional click handler using JS object that contains "onClick" property only in case if clickHandler prop is not empty
  let clickHandlerAttributeContainer: {onClick?: () => void} = {}
  if (clickHandler) {
    clickHandlerAttributeContainer["onClick"] = clickHandler
  }
  return (
    
    <button type='button'
      {...clickHandlerAttributeContainer}
      disabled={disabled}

      className={"rounded-[8px] text-white hover:text-white bg-[#46aae9] hover:bg-[#0076c0] disabled:bg-[#e9e9ed] disabled:text-[gray] p-[10px]" +
      ( additionalTwcssClasses 
      ? " " + additionalTwcssClasses
      : "")}>{/*

      */}{buttonContent}</button>
  )
}