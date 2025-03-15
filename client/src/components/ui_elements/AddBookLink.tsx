import { NavLink} from "react-router-dom";
/**
 * "Add book" link is appears on multiple pages with different text but with same styling created using Tailwing css. 
 * To prevent code dublication a separate React component is created.
 * On both pages link look like a rectangle button, plus sign in front of text, but text is different. 
 * @param {string} linkText - link text
 * @param {string} url - link url
 * 
 */
export function AddBookLink({linkText, url}) {
  return (
    <NavLink to={url}
      className={() => "rounded-[8px] text-white hover:text-white bg-[#46aae9] hover:bg-[#0076c0] p-[10px]"}>
      <span className="mr-[7px]">+</span>{linkText}</NavLink>
  )
}