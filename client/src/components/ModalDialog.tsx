import { useRef, useEffect } from 'react';


type ModalDialogProps = {
  content: string,
  confirmFunction: () => void,
  cancelFunction: () => void
}

/**
 * creates modal dialog with message and two buttons representing 'confirm' and 'cancel' actions intended to offer ability for user to
 * confirm on cancel action described in message, like deleting of some object. If 'confirm' button is pressed then function passed in
 * 'confirmFunction' component prop is envoked, if 'cancel' button is pressed then function passed in 'cancelFunction' is envoked. In
 * real user case 'confirmFunction' function would contain other function invocation that performs f.e. deleting of some object,
 * 'confirmFunction' would contains function that changes parent component's (that has ModalDialog as child component) state to hide
 * ModalDialog component
 * 
 * @param content - string that will be displayed in modal box as a question
 * @param confirmFunction - function that will be executed when use pressed "Yes" button
 * @param cancelFunction - - function that will be executed when use pressed "No" button
 * @returns 
 */

export function ModalDialog({ content, confirmFunction, cancelFunction }: ModalDialogProps) {

  const beginningModalBody = useRef<HTMLDivElement>(null);

  const initialFocusElement = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (initialFocusElement.current !== null) {
      initialFocusElement.current.focus()
    }
  }, []);

  /**
   * removes "overflow:hidden" style from body tag. Used in every action on dialog to remove
   * previously added style to restore scrollbar showing abiblity on body
   */
  function removeOverflowStylingFromBodyTag() {
    document.body.style.overflow = 'auto';
  }

  const _confirm = (event: React.MouseEvent) => {
    //there is event handler on ancestor that closes modal, don't bubble event to prevent triggering
    //that handler as modal is alread closed in current function
    event.stopPropagation();
    removeOverflowStylingFromBodyTag();
    confirmFunction();
  };

  const _cancel = (event: React.MouseEvent) => {
    //there is event handler on ancestor that closes modal, don't bubble event to prevent triggering
    //that handler as modal is alread closed in current function
    event.stopPropagation();
    removeOverflowStylingFromBodyTag();
    cancelFunction();
  };

  /**
   * closes modal dialog and invokes "Cancel" function when user clicks inside of modal root wrapper element but 
   * outside of modal body element (the the element that is centered, has background, text and options)
   * @param {*} event 
   * @returns void 
   */
  const closeModalOnClickOnModal = (event: React.MouseEvent) => {
    let eventPropogationPathElement: HTMLElement | null = event.target as HTMLElement;
    while (eventPropogationPathElement) {
      //traverse elements starting from clicked element to every next ancestor.
      //If modal body element is found, don't do anytning as user has clicked inside of central modal div which
      //contains background, text and buttons, but not clicked on buttons as buttons have their own click handlers
      //which stop bubbling event to parent elements and won't reach outside those buttons also not to modal beginning
      //div where current event handler must be attached
      if (eventPropogationPathElement === beginningModalBody.current) {
        return;
      }

      eventPropogationPathElement = eventPropogationPathElement.parentElement;
    }

    //user clicked outside modal body but inside modal root element, close modal and execute cancel function of modal element
    _cancel(event);
  }

  //set style to body tag to hide scrollbar when displaing modal view to prevent any overflowing
  document.body.style.overflow = 'hidden';

  return (
    <>
      <div className='overlay_for_modal_dialog'></div>
      <div  className='modal_dialog' 
            onClick={closeModalOnClickOnModal}>

        <div className='container'>
          <div  className='body'
                ref={beginningModalBody}>

            <div className='content'>
              <div>{content}</div>
            </div>

            {/* element that receives initial focus when modal is rendered, must be invisible. It is intended that aftef modal appers and
            in case user clicks TAB key then "Confirm" action button receives focus. 
            This solution is better than if "Confirm" option button would be focused when modal is displayed because outline style 
            is default and would not pay users attention as good as if focus outline appears on "Confirm" button after user presses 
            TAB key after modal appears */}
            <button style={{opacity:0, position:"absolute"}} 
                    ref={initialFocusElement}></button>

            <div className='options'>
              <button className='button_confirm' 
                      onClick={ _confirm}>Yes</button>
              <button className='button_cancel' 
                      onClick={_cancel}>No</button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}