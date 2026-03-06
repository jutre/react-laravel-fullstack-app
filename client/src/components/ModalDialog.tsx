import { useRef, useEffect } from 'react';


type ModalDialogProps = {
  message: string,
  confirmFunction: () => void,
  cancelFunction: () => void
}


/**
 * Creates modal dialog with confirm message and "Yes", "No" buttons. If "Yes" button is pressed then function passed in 'confirmFunction'
 * component prop is envoked, if "No" button is pressed then function passed in 'cancelFunction' prop is envoked.
 * Intended to create confirmation dialog when user presses book deleting button
 * 
 * @param message - string that will be displayed in modal box as a message above buttons
 * @param confirmFunction - function that will be executed when use pressed "Yes" button
 * @param cancelFunction - - function that will be executed when use pressed "No" button
 * @returns 
 */

export function ModalDialog({ message, confirmFunction, cancelFunction }: ModalDialogProps) {

  const beginningModalBody = useRef<HTMLDivElement>(null);

  // An invisible button that receives focus when modal is rendered which is created for better useability when user navigates element with
  // TAB key. After modal appears and user pressed TAB key the "Yes" button receives focus and visual highligting. Without focusing on
  // invisible button current focus would remain on "Delete" button user clicked before modal appeared and it would be needed several TAB
  // pressing to get focus to "Yes" button

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
      // Traverse elements starting from clicked element to every next ancestor.
      // If modal body element is found don't do anytning as user has clicked central modal div (that which has white background, contains
      // message and buttons) but not on buttons as buttons have their own click handlers which stop bubbling event to parent elements not reaching modal body
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
      {/* overlay has dark backgroung, does not have click handler as next element will be stacked above overlay and will reveive click */}
      <div className='overlay_for_modal_dialog'></div>

      <div  className='modal_dialog' 
            onClick={closeModalOnClickOnModal}>

        <div className='modal_container'>
          <div  className='body'
                ref={beginningModalBody}>

            <div className='content'>
              <div>{message}</div>
            </div>

            <button style={{ opacity: 0, position: "absolute" }}
              ref={initialFocusElement}
              type='button'></button>

            <div className='options'>
              <button className='button_confirm'
                onClick={_confirm}
                type='button'
              >Yes</button>

              <button className='button_cancel'
                onClick={_cancel}
                type='button'
              >No</button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
