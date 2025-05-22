import { FormFieldsDefinition } from './utils/FormBuilder';

/**
 * react-router paths
 */
//routes for react-router library. Everywhere in code routes info is taken from this variable: for route matcher <Route> element 'path'
//attribute, for URL values when redirecting or creating links. URL path segments can be changed and it will be reflected in application.
//URL path parameter values (like /:bookId/) must not be changed, those values are used in code to extract path parameter values and
//are substituted with actual values when generating URLs for links or redirects
export const routes = {
    bookListPath:"/",
    favoriteBooksListPath:"/favorites/",
    bookEditPath:"/:bookId/edit/",
    createBookPath:"/create/",
    demoDataResetPath:"/demo-data-reset/"
};


/**
 * book creation form definition
 */
export const bookCreatingFormFieldsDef: FormFieldsDefinition = {
    title: {
        label: "Title",
        type: "text",
        validationRules: [
            {
                name: "minLength",
                value: 3,
                message: "field length must be at least three symbols"
            }
        ]
    },
    author: {
        label: "Author",
        type: "text",
        validationRules: [
            {
                name: "minLength",
                value: 3,
                message: "field length must be at least three symbols"
            }
        ]
    },
    preface: {
        label: "Preface",
        type: "textarea"
    },
    added_to_favorites: {
        label: "add to favorites",
        type: "checkbox"
    }
}

/**
 * book creation form definition
 * book editing form has same fields as new book creating form and an extra "id" field
 */

export const bookEditFormFieldsDef: FormFieldsDefinition = {
    ...bookCreatingFormFieldsDef,
    id:{ label: "id", type: "hidden" }
}


/**
 * custom checkbox are created using Tailwindcss classes, they are present in more than one component
 */

//classes that create dimensions, border style and background for div that acts like box with checkmark.
//Same square box is also used for batch selection control (but has it dash instead of checkmark), therefore storing classes in separate
//variable
export const customCheckboxSquareBoxClasses = "block relative w-[18px] h-[18px] border-[2px] border-solid border-[#4066a5] rounded-[3px] bg-white "

//classes for div that acts like a checkmark for custom checkbox (located immediatelly after checkbox input element). Add checkmark
//inside div and add background when checked
export const customCheckboxCheckmarkClasses = customCheckboxSquareBoxClasses +
    "peer-checked:bg-[#ccc] peer-checked:after:block after:hidden after:absolute peer-focus-visible:[outline-style:auto] " +
    "after:left-[4px] after:top-0 after:w-[6px] after:h-[11px] after:border after:border-solid " +
    "after:border-[#4066a5] after:border-t-0 after:border-r-[2px] after:border-b-[2px] after:border-l-0 after:rotate-45 "

//classes for making checbox invisible, "peer" class for Tailwindcss context
export const chekboxInputClasses = "absolute opacity-0 peer"