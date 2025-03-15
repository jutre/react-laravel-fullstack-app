/**
 * h2 is repeating element on several pages with styling created using Tailwing css. To reduce code dublication and updating 
 * necessarity in multiple places a separate React component is created
 * 
 */
export function H1Heading({headingText}) {
  return (
    <h1 className="mb-[30px] text-[24px] leading-[29px] font-extrabold">{headingText}</h1>
  )
}