import { FormFieldsDefinition } from './utils/FormBuilder';

/**
 * REST API base path. Base URL for all requests, it's value is used in RTK Query createApi() definition for fetchBaseQuery.baseUrl 
 * property.
 */
export const restApiBaseUrl = 'http://localhost/laravel_books_api/public/api/';

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
    createBookPath:"/create/"
};


/**
 * book creation form definition
 */
export const bookCreatingFormFieldsDef: FormFieldsDefinition = [
    {
        label: "Title",
        name: "title",
        type: "text",
        validationRules: [
            {
                name: "minLength",
                value: 3,
                message: "field length must be at least three symbols"
            } 
        ]
    },
    {
        label: "Author",
        name: "author",
        type: "text",
        validationRules: [
            {
                name: "minLength",
                value: 3,
                message: "field length must be at least three symbols"
            }
        ]
    },
    {
        label: "Preface",
        name: "preface",
        type: "textarea"
    }
];

/**
 * book creation form definition
 * book editing form has same fields as new book creating form and an extra "id" field
 */
export const bookEditFormFieldsDef = [
    ...bookCreatingFormFieldsDef,
    { label: "id", name: "id", type: "hidden" }
];

