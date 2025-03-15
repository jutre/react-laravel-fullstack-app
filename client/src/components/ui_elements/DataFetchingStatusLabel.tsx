

export const LABEL_TYPE_INFO = "LABEL_TYPE_INFO";
export const LABEL_TYPE_ERROR = "LABEL_TYPE_ERROR";
/**
 * This component is created to prevent code dublication when creating equally styled labels that display Redux async thunk execution 
 * states as such labels are used on multiple pages and Tailwind css is used for styling. 
 * 
 * Each page needs label that conform to Redux async thunk execution states reflecting thunk's "pending" and "rejected" actions while
 * sending or receiving data, semantically conforming to actual performed action like "saving...", "updating..." or "deleting has failed"
 * styled equally but with different text colors distinguishing normal of error states.
 * 
 * @param {string} labelText - data sending process message text like "saving...", "updating...".
 * @param {string} type - two possible values defining style that of label conforming normal or error states: if param value is
 * "info", text color is green, if "error", text color is red
 * 
 */

type DataFetchingStatusLabelProps = {
  labelText: string,
  type?: string
}
export function DataFetchingStatusLabel({ labelText, type = LABEL_TYPE_INFO }: DataFetchingStatusLabelProps) {
  let textColorClass = "text-[green]";
  if (type === LABEL_TYPE_ERROR) {
    textColorClass = "text-[red]";
  }
  return (
    <div className={textColorClass + " absolute mt-[-25px]"}>{labelText}</div>
  )
}