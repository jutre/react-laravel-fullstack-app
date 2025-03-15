import { NavLink} from "react-router-dom";
/**
 * navigation link a is repeating element on several pages with styling created using Tailwing css. To reduce code dublication
 * and updating necessarity in multiple places a separate React component is created
 * 
 */
export function NavLinkBack({url}) {
  return (
    <NavLink className={() => "block max-w-max mb-[30px] underline uppercase font-bold"}
      to={url}>
      <div className="bg-[url('assets/return-button.svg')] inline-block w-[12px] h-[12px] mr-[5px]"></div>
      Back
    </NavLink>
  )
}