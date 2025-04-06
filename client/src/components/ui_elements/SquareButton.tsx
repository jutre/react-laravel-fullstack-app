type SquareButtonProps = {
  buttonContent: React.ReactNode,
  clickHandler?: () => void,
  additionalTwcssClasses?: string,
}
/**
 * Square blue button appears on multiple pages with different text but with same styling (padding, background, hover color ) like 
 * "Add book" button, "Logout" button. 
 *  
 * @param buttonContent - text or React node (html tags, React Fragment tag) that will be placed as <button> element content 
 * @param clickHandler - optional click handler that performs some action when button clicked
 * @param additionalTwcssClasses - some additional valid Tailwind css classes f.e, adding margins, width
 * 
 */
export function SquareButton({buttonContent, clickHandler, additionalTwcssClasses}: SquareButtonProps) {
  //add optional click handler using JS object that contains "onClick" property only in case if clickHandler prop is not empty
  let clickHandlerAttributeContainer: {onClick?: () => void} = {}
  if (clickHandler) {
    clickHandlerAttributeContainer["onClick"] = clickHandler
  }
  return (
    
    <button type='button'
      className={"rounded-[8px] text-white hover:text-white bg-[#46aae9] hover:bg-[#0076c0] p-[10px]"+
      ( additionalTwcssClasses 
      ? " " + additionalTwcssClasses
      : "")}
      {...clickHandlerAttributeContainer}>{buttonContent}</button>
  )
}