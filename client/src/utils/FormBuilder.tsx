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
 * to define a form input field, an object is used to describe usually used elements for form input field: label text associtated with
 * input field, input field's ("input" or "textarea" tag, other not implemented) 'name' attribute, 'type' property value for "input" tag
 * or defines "textarea" tag if value is "textarea"
 */
export interface FieldDefinition {
  label: string,
  name: string,
  type: string,
  validationRules?: ValidationRule[],
}

export type FormFieldsDefinition = FieldDefinition[]

/**
 * form fields's can be filled with data, data is passed as plain object with keys corresponding to input field name and
 * property value is input field's initial value.
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
  initialFormData?: InitialFormData,
  initiallyDisplayedErrors?: ErrorMessages,
  successfulSubmitCallback: (submittedFormData: SubmittedFormData) => void,
  disableAllFields?: boolean
}



//TODO, move this cmnt up in JS version
//TODO: possibly grab type from react element types or if using those
//check it there is possibility in TS to specify that either "checked" or "value" must be present
type InputElementAttributes = {
  name: string,
  id: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void,
  checked?: boolean,
  value?: number | string,
  type?: string,
  disabled?: boolean
}

/**
 * 
 * @param formFieldsDefinition - array of form field's definition objects. Each object's properties are dedicated for following purpose
 * "label" - label text for input field, 
 * "name" - input element's "name" attribute value,  
 * "type" - input element's "type" attribute value
 * "rule" - validation rule for fields value,
 * for example, three fields are defined as follows - 
 * 
 * [{label: "id", name:"id", type:"hidden"},
 *  {label: "Title", name:"title", type:"text", rule:"required"}, 
 *  {label: "Description", name:"description", type:"textarea", rule:"required"}]
 *
 * @param submitButtonText - text for submit button, can be empty, if parameter empty, text will be "Submit"
 * @param initialFormData - object with data that will be filled in form input fields on initial display.
 * @param initiallyDisplayedErrors - when dispaying form there is possibility to display errors. For case when it is necessarry to 
 * display errors received from REST API endpoint like error that "username is already used". Object key corresponds to field name
 * next to which error should be displayed, the value is error message. Initial error message is displayed until there is an input validation
 * error to be displayed next to field. Initial errors do not prevent submitting form.
 * @param successfulSubmitCallback -function what will be invoked after form submit
 * if all fields pass validation
 * @param disableAllFields - if set to true, all input fields, also submit button will be disabled using "disabled".
 * Intended to be used in cases when form must be disabled like while data sending is in process after submit but meanwhile page
 * still displays form.
 * 
 * 
 * @returns
 */


export function FormBuilder({
  formFieldsDefinition,
  submitButtonText,
  initialFormData,
  initiallyDisplayedErrors,
  successfulSubmitCallback,
  disableAllFields }: FormBuilderProps
) {

  submitButtonText = submitButtonText ?? "Submit";
  /*
  TODO finish code for creating radio input, select
  TODO - currently in case if initial data object contains properties that are not present as form fields they are also
  submitted (unmodified). Decide is it is needed to eliminate them and submit only object with fields that are 
  present in form fields definition prop as input fields */

  //will track all input fields values
  const [inputFieldValues, setInputFieldValues] = useState<SubmittedFormData>({});
  const [inputErrors, setInputErrors] = useState<ErrorMessages>({});
  const [initialErrors, setInitialErrors] = useState<ErrorMessages>({});

  /* Assigning initialFormData parameter value to component's state that maintains all form's input fields values. Doing that in
  useEffect hook with dependancy of initialFormData parameter to execute assigning initialFormData parameter's value to state 
  in case current component is re-rendered with different initialFormData value*/
  useEffect(() => {

    /* Create an key/value object that maintains all form's input fields' values in form of {"input field name" => "field value"}. This
    object contains a corresponding entry for each entry from form definition parameter array, entrie's value will be either empty string ""
    or boolean "false" if initial data for corresponding field is not set or value from initialFormData parameter if set for corresponding
    field. The created object is assigned to component's state which is source of values for all controlled input fields, when submit button
    is pressed this object is passed as submitted data to a callaback function that processes submitted data and contains data from each
    form field.
    Initial form data runtime values with types "string", "number", "boolean" and "null" values are converted to "string" or "boolean" runtime
    type values. Initial value is converted to "string" runtime type for all fields except checkbox input element where type is converted to
    boolean and used as input's "checked" attribute value when creating input field.
    */

    //Create a copy of param initialFormData object as it might be modified. In some cases passed value might be readonly as with
    //objects coming from Redux, but we need an object that can be modified for values type correction to string/Boolean
    let initialFormDataCorrectedTypes: SubmittedFormData = {};

    formFieldsDefinition.forEach(formElementDef => {
      let fieldName = formElementDef.name
      
      //prepare initial value, get it from initial data parameter or use default empty string
      type InitialFieldValueType = InitialFormData[string]
      let initialFieldValue: InitialFieldValueType = "";
      if(initialFormData && initialFormData[fieldName]){
        initialFieldValue = initialFormData[fieldName]
      }

      if (formElementDef.type === "checkbox") {
        //set boolean type value for checkbox, coercing non boolean value to boolean
        initialFormDataCorrectedTypes[fieldName] = Boolean(initialFieldValue);

      } else {
        //for all other fields convert initial value if set to a string type
        initialFormDataCorrectedTypes[fieldName] = String(initialFieldValue);
      }
    })

    //finally set corrected data to state
    setInputFieldValues(initialFormDataCorrectedTypes);

  }, [initialFormData]);


  /* Setting initially displayed errors to state using useEffect hook with to force populating new param value in case parent
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

    for (const formElementDef of formFieldsDefinition) {
      //if validation rules are absent for this field, go to next field
      if (!Array.isArray(formElementDef.validationRules)) {
        continue;
      }

      const fieldName = formElementDef.name;
      const fieldValue = inputFieldValues[fieldName];
      formElementDef.validationRules.forEach((validatRulesObj) => {
        let errMsgForCurrentField: string | undefined = undefined;

        //rule "required" - don't allow empty string
        //fieldValue will be undefined if input field was not assigned default value and was not changed anyway (change 
        //handler did not mofify appropriate prop in inputFieldValues object). 
        if (validatRulesObj.name === "required" &&
          //TODO add casting to string in JS version
          (fieldValue === undefined || String(fieldValue).trim() === "")) {
          const defaultErrMsg = "this field must not be empty";

          //use error message from form definition if it is set
          errMsgForCurrentField = validatRulesObj.message ? validatRulesObj.message : defaultErrMsg;


          //rule "minLength" - don't allow shorter than string length than defined in rule's "value" field.
          //If field is empty string, create error message that field must not be empty and minimal length that 
          //string should be, if string is not empty and too short, create error message that field value's length
          //should not be shorter than specified in rule
        } else if (validatRulesObj.name === "minLength") {
          //TODO possible add casting to string in JS version
          let fieldValueMinLength = parseInt(String(validatRulesObj.value));

          if (fieldValue === undefined ||
            //TODO add casting to string in JS version
            String(fieldValue).trim().length < fieldValueMinLength) {
            const defaultErrorMsg = `field's length must be at least ${fieldValueMinLength} 
                symbol${fieldValueMinLength > 1 ? "s" : ""}`;

            //use error message from form definition if it is set
            errMsgForCurrentField = validatRulesObj.message ? validatRulesObj.message : defaultErrorMsg;

          }
        }

        if (errMsgForCurrentField) {
          errors = { ...errors, [fieldName]: errMsgForCurrentField };
          //if input validation error exists for current field, remove error initially snown error for field, invalid input error will be
          //snown instead
          if (fieldName in initialErrors) {
            delete initialErrors[fieldName]
          }
        }
      })
    }


    //if there are no input errors, call sucessfull submit callback
    if (Object.keys(errors).length === 0) {
      successfulSubmitCallback(inputFieldValues);
    }

    //set actual errors to state for displaying
    setInputErrors(errors);
  }

  return (
    <form onSubmit={handleSubmit} className="form_builder">
      {(formFieldsDefinition).map((formElementDef) => {
        let fieldName = formElementDef.name;
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

        //in "checbox" input element assign current field's value to "checked" attribute,
        //for all other input types value goes to "value" attribute.
        //Do not allow 'undefined' value for "value" or "checked" attributes for controlled input element -
        //field's value's initial data might be 'undefined' usually for forms without initial data
        if (formElementDef.type === "checkbox") {
          inputElemAttributes.checked = Boolean(fieldValue);
          //TODO remove this comment also in JS verson
          // if(inputElemAttributes.checked === undefined){
          //   inputElemAttributes.checked = false;
          // }

        } else {
          inputElemAttributes.value = fieldValue ? String(fieldValue) : "";
        }

        //create "input", "textarea", etc. html tag corresponding to type of input in form definition object
        //TODO - add code for "select" tag creation, "<input type='radio' />
        let inputTag;
        if (formElementDef.type === "text" || formElementDef.type === "checkbox" || formElementDef.type === "hidden") {
          inputElemAttributes.type = formElementDef.type;
          inputTag = <input {...inputElemAttributes} />;

        } else if (formElementDef.type === "textarea") {
          inputTag = <textarea {...inputElemAttributes} />;
        }

        /**
         * input tag is created, we must wrap it in div and place label as needed according 
         * to type of input element
         */

        //for "hidden" type input return just <input> tag here, no additional wrapping or label
        if (formElementDef.type === "hidden") {
          //recteate tag by adding "key" attribute which is needed for React in list rendering
          return <input {...inputElemAttributes} key={fieldName} />;
        }

        /*for all input tags except checkbox, label comes before input field, checkbox also have
        additional markup to have ability to style it as needed*/
        let inputTagWithLabel;
        let fieldWrapperCssClass = "field " + formElementDef.type;
        if (formElementDef.type === "checkbox") {
          inputTagWithLabel = (
            <>
              <div>{inputTag}</div>
              <label htmlFor={fieldName}>{formElementDef.label}</label>
            </>);
        } else {
          inputTagWithLabel = <> <label htmlFor={fieldName}>{formElementDef.label}</label> {inputTag} </>;
        }
        return (
          <div className={fieldWrapperCssClass} key={fieldName}>
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
      {/* TODO  add disabled={disableAllFields === true} also to JS version*/}
    </form>
  );
}