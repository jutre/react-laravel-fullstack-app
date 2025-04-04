import { NavLink} from "react-router-dom";

type NavLinkBackProps = {
  url: string
}

/**
 * navigation link a is repeating element on several pages with same styling 
 * 
 * @param url - link url
 */
export function NavLinkBack({url}: NavLinkBackProps) {
  return (
    <NavLink className={() => "block max-w-max mb-[30px] underline uppercase font-bold"}
      to={url}>
      <div className="bg-[url('assets/return-button.svg')] inline-block w-[12px] h-[12px] mr-[5px]"></div>
      Back
    </NavLink>
  )
}