import { useLocation, Link } from "react-router-dom";
import { routes } from "../config";
import { useSetPageTitleTagValue } from "../hooks/useSetPageTitleTagValue";
import { H1Heading } from "./ui_elements/H1Heading";

export function PageNotFound() {

  useSetPageTitleTagValue("Page not found")

  const location = useLocation();
  const pagePath = location.pathname;
  return  (
    <div>
      <H1Heading headingText="Page not found"/>
      <p>The page with address &quot;{pagePath}&quot; was not found.</p>
      
      <p className="mt-[30px]">Go to <Link to={routes.bookListPath}>home page</Link>.</p>
    </div>
  )
}
