type GeneralErrorMessageProps = { msgText: string }

/**
 * This component is created to prevent code dublication when creating error message as such labels are used on multiple pages and 
 * Tailwind css is used for styling. 
 * 
 * Creates red colored div with text and border around it 
 * 
 * @param {string} msgText - error message text
 * 
 */
export function GeneralErrorMessage({ msgText }: GeneralErrorMessageProps) {
  return (
    <div className="text-[red] border border-[red] rounded-[8px] mb-[15px] p-[10px] max-w-max">{msgText}</div>
  )
}