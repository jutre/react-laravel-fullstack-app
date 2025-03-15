import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { routes } from "../config";
import { setPageTitleTagValue } from "../utils/setPageTitleTagValue";
import { H1Heading } from "./ui_elements/H1Heading";

function PageNotFound() {

  useEffect(() => {
    setPageTitleTagValue("Page not found");
  }, []);

  const location = useLocation();
  let pagePath = location.pathname;
  return  (
    <div>
      <H1Heading headingText="Page not found"/>
      <p>The page with URL "<em>{pagePath}</em>" for was not found.</p>
      
      <p>You can explore books list on <Link to={routes.bookListPath}>books list page</Link> or by using searching form 
        at the to of the page.</p> 
    </div>
  )
}


export default PageNotFound;
