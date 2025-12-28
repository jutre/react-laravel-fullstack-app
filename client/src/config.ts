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
}


/**
 * book creation form definition
 */
export const bookCreatingFormFieldsDef: FormFieldsDefinition = {
    title: {
        label: "Title",
        type: "text",
        validationRules: [
            {
                rule: "minLength",
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
                rule: "minLength",
                value: 3,
                message: "field length must be at least three symbols"
            }
        ]
    },
    preface: {
        label: "Preface",
        type: "textarea"
    },
    literary_genre_id: {
        label: "Book genre",
        type: "select",
        promptLabelOverride: "-- not specified --"
    },
    is_favorite: {
        label: "add to favorites",
        type: "checkbox"
    }
}

/**

 * book editing form has same fields as new book creating form and an extra "id" field
 */

export const bookEditFormFieldsDef: FormFieldsDefinition = {
    ...bookCreatingFormFieldsDef,
    id:{ label: "id", type: "hidden" }
}


/**
 * Custom checkboxes are used in multiple places, as Tailwindcss is used keep needed CSS classes in one place using variables.
 * There also exists a control for selecting/deselecting all list items' checkboxes visually similar to checkbox, it is represented by same
 * size and style square but dash instead of checkmark. CSS classes creating square will be saved in separate variable and another variable
 * will have contain value of mentioned variable contatenated with other other CSS classes neede to create visually custom ckeckbox
 */

//classes for <input type="checbox"/> element to hide it and add class name "peer" to make it work with Tailwindcss
export const chekboxInputClasses = "absolute opacity-0 peer"

//classes for control for selecting/deselecting all list items' checkboxes
export const customCheckboxSquareBoxClasses =
    "block relative w-[18px] h-[18px] border-[2px] border-solid border-[#4066a5] rounded-[3px] bg-white "

//classes for visually custom ckeckbox
//TODO - add graying out for disabled checkbox
export const customCheckboxCheckmarkClasses = customCheckboxSquareBoxClasses +
    "peer-checked:bg-[#ccc] peer-checked:after:block after:hidden after:absolute peer-focus-visible:[outline-style:auto] " +
    "after:left-[4px] after:top-0 after:w-[6px] after:h-[11px] after:border after:border-solid " +
    "after:border-[#4066a5] after:border-t-0 after:border-r-[2px] after:border-b-[2px] after:border-l-0 after:rotate-45 "
