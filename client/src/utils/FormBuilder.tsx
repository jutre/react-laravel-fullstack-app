import { useState, useEffect } from 'react';

export type ValidationRule =

  //rule for non empty value
  {
    name: "required",
    //overrides default error message "this field must not be empty"
    message?: string
  } |

  //rule for non value's minimal length
  {
    name: "minLength",
    value: number,
    //overrides default error message "field's length must be at least (n) symbols"
    message?: string
  } |

  //rule for field where value should be valid email string
  {
    name: "email",
    //overrides default error message "invalid email format"
    message?: string
  }

// 
// 

/**
 * information for creating an a pair of HTML tags in form: an input element ("input", "textarea", etc.) tags and "label" tag associated
 * with input element. Object contains 'type' attribute for HTML input text and text for creating 'label' tag that is associated with input
 * tag.
 */
export interface FieldDefinition {
  label: string,
  type: string,
  validationRules?: ValidationRule[],
}

/**
 * all form's contained fields definition root object. Object property name serves as a HTML input element's ("input", "textarea", etc.)
 * 'name' attribute, property value is object containing some other information about form's main structural element which is a pair: HTML
 * input tag and it's associated 'label' tag
 */
export type FormFieldsDefinition = {
  [index: string]: FieldDefinition
}

/**
 * if null value is passed as fields initial data the effect is same as there is no initial data passed for field - on initial render field
 * is assigned a default value depending on forms input type as in case if initial data is not passed and in case initial data parameter is
 * passed on subsequet render the field value is not overriden. The reason null value is added to parameter type is convenience of passing
 * objects received from REST API as initial form data without need to convert object's null value properties to dedicated property type
 * empty value (empty string, false boolean, zero), the form displays those fields as blank/unchecked html input fields
 */
export type InitialFormData = {
  [index: string]: number | string | boolean | null
}

/**
 * Object key corresponds to field name next to which error should be displayed, the value is error message.
 */
export type ErrorMessages = {
  [index: string]: string
}

/**
 * submitted data is plain object with keys corresponding to input field name and property value is submitted data. All input fields' values
 * except checkbox input fields are returned as "string" type values, for checkbox boolean type is returned
 */
export type SubmittedFormData = {
  [index: string]: string | boolean
}

interface FormBuilderProps {
  formFieldsDefinition: FormFieldsDefinition,
  submitButtonText?: string,
  initialFormData?: InitialFormData | null,
  initiallyDisplayedErrors?: ErrorMessages | null,
  successfulSubmitCallback: (submittedFormData: SubmittedFormData) => void,
  disableAllFields?: boolean,
  checkboxCssCls?: string,
  checkboxFollwingSiblingCssCls?: string
}


type InputElementAttributes = {
  name: string,
  id: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void,
  checked?: boolean,
  value?: number | string,
  type?: string,
  disabled?: boolean,
  className?: string
}

/**
 * 
 * @param formFieldsDefinition - array of form field's definition objects. Each object's properties are dedicated for following purpose
 * "label" - label text for input field, 
 * "name" - input element's "name" attribute value,  
 * "type" - input element's "type" attribute value
 * "rule" - validation rule for field's value.
 * 
 * Example of object defining three input fields definition -
 * 
 * [
 *  { label: "id",
 *    name: "id",
 *    type: "hidden"
 *  },
 *  { label: "Title",
 *    name: "title",
 *    type:"text",
 *    validationRules: [
 *      {name: "required"},
 *      ...<possibly other rules: "minLength", "email">
 *    ]
 *  }, 
 *  { label: "Description",
 *    name:"description",
 *    type:"textarea"
 *  }
 * ]
 *
 * @param submitButtonText - text for submit button, can be empty, if parameter empty, text will be "Submit"
 * @param initialFormData - object with form's input fields initial values. Intended to be used to create form with prefilled fields when
 * displayed initially or overriding needed field values after a form submit. initialFormData object property with a certain name holds
 * initial or override value for input field which has same name. The use case of updating field's value on some subsequent form render
 * after form submit would be login form where form after incorrect login/password is displayed with email field as it was entered by user
 * and setting password field blank
 * @param initiallyDisplayedErrors - when dispaying form there is possibility to display errors. For case when it is necessarry to 
 * display errors received from REST API endpoint like error that "username is already used". Object key corresponds to field name
 * next to which error should be displayed, the value is error message. Initial error message is displayed until there is an input validation
 * error to be displayed next to field. Initial errors do not prevent submitting form.
 * @param successfulSubmitCallback -function what will be invoked after form submit
 * if all fields pass validation
 * @param disableAllFields - if set to true, all input fields, also submit button will be disabled using "disabled".
 * Intended to be used in cases when form must be disabled like while data sending is in process after submit but meanwhile page
 * still displays form.
 * @param checkboxCssCls - class name for that is assigned to every checkbox type input element if parameter not empty. Intended to be used
 * in case Tailwindcss is used for defining CSS style in application to prevent need to make a copy of styles for custom checkbox in regular
 * CSS stylesheet. Instead needed Tailwindcss classes can be passed to checkbox using current parameter and together with classed passed
 * using current component's checkboxFollwingSiblingCssCls parameter to an element immediatelly following checkbox input
 * @param checkboxFollwingSiblingCssCls - class name for that is assigned to an element immediatelly following checkbox input element if
 * parameter not empty. Intended to be used in case Tailwindcss is used for defining CSS style in application to prevent need to make a copy
 * of styles for custom checkbox in regular CSS stylesheet. Instead needed Tailwindcss classes can be passed to an element immediatelly
 * following checkbox input. Those classes together with classed passed to checkbox imput element allow to create custom checkbox style like
 * it is done with traditional CSS but using Tailwind classes
 * @returns
 */


export function FormBuilder({
  formFieldsDefinition,
  submitButtonText,
  initialFormData,
  initiallyDisplayedErrors,
  successfulSubmitCallback,
  disableAllFields,
  checkboxCssCls,
  checkboxFollwingSiblingCssCls }: FormBuilderProps
) {

  submitButtonText = submitButtonText ?? "Submit"

  //maintains all form's input fields' values making each form field a React "controlled input field"
  const [inputFieldValues, setInputFieldValues] = useState<SubmittedFormData>({});
  //contains input validation errors from validation after "submit" button pressed
  const [inputErrors, setInputErrors] = useState<ErrorMessages>({});
  const [initialErrors, setInitialErrors] = useState<ErrorMessages>({});

  /* Assigning initialFormData parameter value to component's state that maintains all form's input fields values. Doing that in
  useEffect hook with dependancy of initialFormData parameter to execute assigning initialFormData parameter's value to state 
  in case current component is re-rendered with different initialFormData value*/
  useEffect(() => {

    /* Create an key/value object {<input field name> => <field value>} that maintains all form's input fields' values and set it to
    component's state making each form field a React "controlled input field". The object will be added a corresponding key/value pair from each
    formFieldsDefinition parameter array element. Each object's entie's value will be set to either empty string "" or boolean "false" if
    there is no data in initialFormData parameter for corresponding field or value from initialFormData parameter if initial value for
    curent field exists. Values from initialFormData parameter with runtime types "string", "number", "boolean" are converted to values with
    "string" or "boolean" runtime type values according to input field's type: any of initial value is converted to "string" runtime type
    for all html input field types except 'checkbox' type where value is converted to boolean type as it is used as input's 'checked'
    attribute value.*/

    let initialFormDataCorrectedTypes: SubmittedFormData = {};

    for (const [fieldName, fieldOtherInfo] of Object.entries(formFieldsDefinition)) {
      
      type InitialFieldValueType = InitialFormData[string]
      //field's value preparing - either set to default empty value (""), if entry with field name exists in controlled input field's state
      //variable use that value (keeping value from previous render or user input), and finally it is overriden by value from
      //initialFormData parameter if initial value is present for field
      let initialFieldValue: InitialFieldValueType = ""
      if(inputFieldValues[fieldName] !== undefined){
        initialFieldValue = inputFieldValues[fieldName]
      }
      if(initialFormData &&
        (initialFormData[fieldName] !== undefined && initialFormData[fieldName] !== null)){
        initialFieldValue = initialFormData[fieldName]
      }

      //convert prepared value to runtime type accdording to html input field type
      if (fieldOtherInfo.type === "checkbox") {
        //set boolean type value for checkbox, coercing non boolean value to boolean
        initialFormDataCorrectedTypes[fieldName] = Boolean(initialFieldValue);

      } else {
        //for all other fields convert initial value if set to a string type
        initialFormDataCorrectedTypes[fieldName] = String(initialFieldValue);
      }

      /*TODO add code for creating radio, select input fields*/

    }

    //finally set corrected data to state
    setInputFieldValues(initialFormDataCorrectedTypes);

  }, [initialFormData]);


  /* Setting initially displayed errors to state using useEffect hook to force populating new param value in case parent
  component renders form data with different value*/
  useEffect(() => {
    if (initiallyDisplayedErrors) {
      setInitialErrors(initiallyDisplayedErrors)

    } else {
      setInitialErrors({})
    }
  }, [initiallyDisplayedErrors]);

  /**
   * sets changed input fiel's value into state variable. State variable is the one user to
   * maintain 'controlled inputs fields' in React TODO add this comment to pure JS version
   * 
   * @param event 
   */
  const onInputFieldsChange = (event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    let name = event.target.name;

    //input field value type for all fields except checkbox comes from 'value' attribute.
    //for checkbox type input field use boolean type value as for checbox input "cheched" attribute value is keeped in state.
    //Also value from state will be assigned to "checked" attribure when rendering checkbox input
    let value: string | boolean = event.target.value;
    if (event.target.type === "checkbox" && "checked" in event.target) {
      value = event.target.checked;
    }
    setInputFieldValues(values => ({ ...values, [name]: value }));
  };

  /**
   * when form is submited, validate each field's value according each fields validation rules from form definition array. 
   * If no errors found, invoke function passed to successfulSubmitCallback parameter
   * @param {*} event 
   */
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    //clear previous errors, as this will be filled with errors from current validation
    let errors = {};

    for (const [fieldName, fieldOtherInfo] of Object.entries(formFieldsDefinition)) {
      //if validation rules are absent for this field, go to next field
      if (!Array.isArray(fieldOtherInfo.validationRules)) {
        continue;
      }


      const fieldValue = inputFieldValues[fieldName];
      let errMsgForCurrentField = "";
      //validate field value for every rule that is defined for field
      /*Error about the last broken rule from rules array is set to be shown next to input field. If field has two validation rules in
      following order: [{"minLength", ..} and {"email"} and input value is f.e. "aa" then both rules are broken, the error set to be shown
      next to input field is "field value must be a valid email address" as it is last rule in rules array but error "field length must be
      at least <n> symbols" should be snown better while string is too short. Therefore in rules array "minLength" should be the last one
      as it is better to first state about too short string and if string lenght is enough only then display error about invalid email
      format*/
      fieldOtherInfo.validationRules.forEach((validatRulesObj) => {

        //rule "required" - don't allow empty string
        //fieldValue will be undefined if input field was not assigned default value and was not changed anyway (change 
        //handler did not mofify appropriate prop in inputFieldValues object). 
        if (validatRulesObj.name === "required" &&  (fieldValue === undefined || String(fieldValue).trim() === "")) {
          const defaultErrMsg = "this field must not be empty";

          //use error message from form definition if it is set
          errMsgForCurrentField = validatRulesObj.message ? validatRulesObj.message : defaultErrMsg;


          //rule "minLength" - don't allow shorter than string length than defined in rule's "value" field.
          //If field is empty string, create error message that field must not be empty and minimal length that 
          //string should be, if string is not empty and too short, create error message that field value's length
          //should not be shorter than specified in rule
        } else if (validatRulesObj.name === "minLength") {
          let fieldValueMinLength = parseInt(String(validatRulesObj.value));

          if (fieldValue === undefined || String(fieldValue).trim().length < fieldValueMinLength) {
            const defaultErrorMsg = `field's length must be at least ${fieldValueMinLength} 
                symbol${fieldValueMinLength > 1 ? "s" : ""}`;

            //use error message from form definition if it is set
            errMsgForCurrentField = validatRulesObj.message ? validatRulesObj.message : defaultErrorMsg;

          }

          //rule "email" - must be valid email format string
        }else if(validatRulesObj.name === "email"){
          let inputTrimmedLoverCase = String(fieldValue).trim().toLowerCase();
          if(!inputTrimmedLoverCase.match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          )){
            const defaultErrMsg = "field value must be a valid email address";

            //use error message from form definition if it is set
            errMsgForCurrentField = validatRulesObj.message ? validatRulesObj.message : defaultErrMsg;
          }
        }


      })
      if (errMsgForCurrentField) {
        errors = { ...errors, [fieldName]: errMsgForCurrentField };
        //if input validation error exists for current field, remove error initially snown for field, invalid input error will be
        //snown instead
        if (fieldName in initialErrors) {
          delete initialErrors[fieldName]
        }
      }
    }


    //if there are no input errors, call sucessful submit callback with form field value object
    if (Object.keys(errors).length === 0) {
      successfulSubmitCallback(inputFieldValues);
    }

    //set actual errors to state for displaying
    setInputErrors(errors);
  }

  return (
    <form onSubmit={handleSubmit} className="form_builder">
      {Object.entries(formFieldsDefinition).map(([fieldName, fieldOtherInfo]) => {
        const fieldValue = inputFieldValues[fieldName];


        //Adding attributes present in all input elements.
        //All input elements also have change handler as they are controlled input fields
        let inputElemAttributes: InputElementAttributes = {
          name: fieldName,
          id: fieldName,
          onChange: onInputFieldsChange
        };

        if (disableAllFields) {
          inputElemAttributes.disabled = true;
        }

        //assing value from state to current field's input element's 'value' or 'checked' attribute depending on input element being
        //checbox or other; converting state object's value general type "string | boolean" to runtime type that corresponds to input
        //element's type - checkbox needs boolean type value, other needs string type value
        if (fieldOtherInfo.type === "checkbox") {
          inputElemAttributes.checked = Boolean(fieldValue);

        } else {
          inputElemAttributes.value = String(fieldValue);
        }


        if (fieldOtherInfo.type === "checkbox" && checkboxCssCls) {
            inputElemAttributes.className = checkboxCssCls;
        }

        //create "input", "textarea", etc. html tag corresponding to type of input in form definition object
        //TODO - add code for "select" tag creation, "<input type='radio' />
        let inputTag;
        if (fieldOtherInfo.type === "text" || fieldOtherInfo.type === "checkbox" || fieldOtherInfo.type === "hidden"
        || fieldOtherInfo.type === "password") {
          inputElemAttributes.type = fieldOtherInfo.type;
          inputTag = <input {...inputElemAttributes} />;

        } else if (fieldOtherInfo.type === "textarea") {
          inputTag = <textarea {...inputElemAttributes} />;
        }

        /**
         * input tag is created, it must be wrapped and label tag placed before or after input depending whether it is checkbox input
         * or not; hidden input elements are not wrapper and no label attached with it
         */

        //the 'hidden' type input tag is returned here as it has no label tag attached or any wrapping.
        //Also add 'key' attribute (for other input field and label 'key' attribute is added to wrapper element)
        if (fieldOtherInfo.type === "hidden") {
          return <input {...inputElemAttributes} key={fieldName} />;
        }

        //for all input tags except checkbox, label comes before input field. Checkbox input is followed by empty div to have possibility
        //to create custom checkbox style using css, it always has class name 'checkmark' present and appended class names from component
        //property if it is not empty. input tag and "checkmark" div is placed inside label tag to make click on "checkmark" div detectable
        //in input when clicking on it
        let inputTagWithLabel;
        if (fieldOtherInfo.type === "checkbox") {
          inputTagWithLabel =
            <label htmlFor={fieldName}>
              <div>
                {inputTag}
                {/*an element following*/}
                <div className={'checkmark ' + (checkboxFollwingSiblingCssCls ? checkboxFollwingSiblingCssCls : '')}></div>
              </div>
              {fieldOtherInfo.label}
            </label>;

        } else {
          inputTagWithLabel =
            <>
              <label htmlFor={fieldName}>{fieldOtherInfo.label}</label> {inputTag}
            </>;
        }

        return (
          <div className={"field " + fieldOtherInfo.type} key={fieldName}>
            {inputTagWithLabel}

            {inputErrors[fieldName] &&
              <div className='input_error'>{inputErrors[fieldName]}</div>}

            {initialErrors[fieldName] &&
              <div className='input_error'>{initialErrors[fieldName]}</div>}
          </div>);
      }
      )}

      <input type="submit"
        value={submitButtonText}
        disabled={disableAllFields === true} />

    </form>
  )
}
