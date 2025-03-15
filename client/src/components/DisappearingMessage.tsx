import { useState, useEffect } from "react";

/**
 * Component that intended to be used for animating some message gradual hiding after it has been displayed. Intended to be 
 * used to show message that some event has completed like data saved or deleted and after that hiding that message.
 * It is achieved by letting create css transitions when html element styling changes by adding addition html class to element.
 * Div containing message is rendered for first time with certain html classes and after speficified time elapses
 * re-rendered for second time with  additional class added. 
 * To work correctly this component must be added to comsuming component's render function produced jsx at moment 
 * when message must be displayed using 
 *  {condition && <DisappearingMessage/>} 
 * to achieve effect that <DisappearingMessage/> component is mounted for first time to have it's useEffect hook launched
 * after after first render (mount). If <DisappearingMessage/> is wrapped in some component that is shown/hidden using css
 * properties the transition won't happen as useEffect hook in <DisappearingMessage/> would already had been ran before when
 * wrapping component mounted
 * 
 * @returns 
 */

type DisappearingMessageProps = {
  messageText: string,
  initialDisplayDuration: number
}
function DisappearingMessage({messageText, initialDisplayDuration=700}: DisappearingMessageProps) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    //after speficified timeout elapses add another html class which would create transitions for message hiding  
    let timer = setTimeout(() => {
      setHidden(true);
    }, initialDisplayDuration);

    return () => clearTimeout(timer);
  }, []);
  
  return (
    //div is hidden by opacity:0 css property on second render, css transition is used, div is disappearing during short time while
    //moving a bit to top
    <div className={"bg-[green] text-[white] rounded-[8px] max-w-max absolute mt-[-30px] p-[4px] transition-all duration-400 ease-linear " +
      (hidden 
      ? "opacity-0 mt-[-37px]"
      :"")}>
      <div>
        {messageText}
      </div>
    </div>)
  
}

export default DisappearingMessage;
