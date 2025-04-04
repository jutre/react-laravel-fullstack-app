type H1HeadingProps = {
  headingText: string
}

/**
 * h2 is repeating element on several pages with same styling
 * 
 */
export function H1Heading({headingText}: H1HeadingProps) {
  return (
    <h1 className="mb-[30px] text-[24px] leading-[29px] font-extrabold">{headingText}</h1>
  )
}