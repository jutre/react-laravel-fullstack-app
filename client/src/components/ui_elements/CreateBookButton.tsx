import { useNavigate } from "react-router-dom"
import { routes } from "../../config";
import { SquareButton } from "./SquareButton"

type CreateBookButtonProps = {
  urlRedirectFunctOverride?: () => void,
}

/**
 * Button that redirects to new book creating URL
 * 
 * @param urlRedirectFunctOverride - on book creating page the "New book" button does not redirect to book creating URL (URL stays the same)
 * but click on it must change book creating component state variable. When current parameter is set it is used instead of default handler
 * that redirects to book creating URL
 * 
 */
export function CreateBookButton({ urlRedirectFunctOverride }: CreateBookButtonProps) {

  const newBookButtonContent =
    <>
      <span className="mr-[7px]">+</span>New book
    </>

  const navigate = useNavigate()

  const redirectToBookCreatingPage = () => {
    navigate(routes.createBookPath)
  }

  const clickHandler = urlRedirectFunctOverride ? urlRedirectFunctOverride : redirectToBookCreatingPage

  return <SquareButton buttonContent={newBookButtonContent}
    clickHandler={clickHandler}
    additionalTwcssClasses="absolute top-[-5px] right-0" />
}