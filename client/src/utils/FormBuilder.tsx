import { useState, useEffect } from 'react';

export type ValidationRule =

  //rule for non empty value
  {
    rule: "required",
    //overrides default error message "this field must not be empty"
    message?: string
  } |

  //rule for non value's minimal length
  {
    rule: "minLength",
    value: number,
    //overrides default error message "field's length must be at least (n) symbols"
    message?: string
  } |

  //rule for field where value should be valid email string
  {
    rule: "email",
    //overrides default error message "invalid email format"
    message?: string
  }

//represents information for creating 'option' tags for 'select' input element or list of 'radio' type input tags
type InputElementOption = {
  value: string | number,
  label: string
}
export type InputOptionsList = InputElementOption[]

/**
 * information for creating an a pair of HTML tags in form: an input element ("input", "textarea", etc.) tags and "label" tag associated
 * with input element. Object contains 'type' attribute for HTML input text and text for creating 'label' tag that is associated with input
 * tag.
 */
export type FieldDefinition = {
  type: "text" | "checkbox" | "hidden" | "password" | "textarea",
  label: string,
  validationRules?: ValidationRule[],
} |

{
  type: "select",
  label: string,
  //TODO improve comment
  //Replaces the default prompt option label text "Select..." if value is a non empty string.
  //Prompt option is the first input option in 'select' input element added by default with "Select..." label and empty string "" value
  // which simplifies 'select' input creating by eleminating need to programmatically add a first promt option letting just set actual
  //input options array for the 'select' input. Default prompt option adding can be prevented by corresponding configuration option
  promptLabelOverride?: string,
  //if set to true then default prompt option is not added to 'select' input element options letting programmer build options without
  //promt option
  hidePropmtOption?: boolean,
  validationRules?: ValidationRule[]
  /*!!! options list for input element is passed via component props. It can't be included in form definition constant to cover case when
  options list becomes known only after it is fetched from API*/
} |

{
  label: string,
  type: "radio",
  validationRules?: ValidationRule[]
  /*!!! options list for input element is passed via component props. It can't be included in form definition constant to cover case when
  options list becomes known only after it is fetched from API*/
}

/**
 * all form's contained fields definition root object. Object property name serves as a HTML input element's ("input", "textarea", etc.)
 * 'name' attribute, property value is object containing some other information about form's main structural element which is a pair: HTML
 * input tag and it's associated 'label' tag
 */
export type FormFieldsDefinition = {
  [index: string]: FieldDefinition
}

//TODO - improve comment for type
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
 * Options list for select/radio input elements. Object index corresponds to select/radion input field name to which options list is
 * to be attached
 */
export type OptionsForInputFields = {
  [index: string]: InputOptionsList
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
  optionsForSelectOrRadioFields?: OptionsForInputFields | null,
  initiallyDisplayedErrors?: ErrorMessages | null,
  successfulSubmitCallback: (submittedFormData: SubmittedFormData) => void,
  disableAllFields?: boolean,
  checkboxCssCls?: string,
  checkboxFollwingSiblingCssCls?: string
}

type InputChangeEventTypes = React.ChangeEvent<HTMLInputElement> |
  React.ChangeEvent<HTMLTextAreaElement> |
  React.ChangeEvent<HTMLSelectElement>

type InputElementAttributes = {
  name: string,
  id: string;
  onChange: (event: InputChangeEventTypes) => void,
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
 * {
 *    id: {
 *      label: "id",
 *      type: "hidden"
 *    },
 *    title: {
 *      label: "Title",
 *      type: "text",
 *      validationRules: [
 *        //rule defining that field must not be empty
 *        {
 *          rule: "required"
 *        },
 *        //rule defining minimal string length that must be input in field to be valid;
 *        //"value" property - minimal lenght value
 *        //"message" property - optional error message that overrides default for generated error message about minimal string length
 *        {
 *          rule: "minLength",
 *          value: 3,
 *          message: "field length must be at least three symbols"
 *        },
 *        //rule defining that field value must be valid email format string
 *        //"message" property - optional error message that overrides default for generated error message with requirement an input value
 *        //to conform to valid email format
 *        {
 *          rule: "email",
 *          message: "please provide valid email!"
 *          }
 *      ]
 *    },
 *    description: {
 *      label: "Description",
 *      type:"textarea"
 *    }
 * }
 *
 * @param submitButtonText - text for submit button, can be empty, if parameter empty, text will be "Submit"
 * @param initialFormData - object with form's input fields initial values. Intended to be used to create form with prefilled fields when
 * displayed initially or overriding needed field values after a form submit. initialFormData object property with a certain name holds
 * initial or override value for input field which has same name. The use case of updating field's value on some subsequent form render
 * after form submit would be login form where form after incorrect login/password is displayed with email field as it was entered by user
 * and setting password field blank
 * @param optionsForSelectOrRadioFields - options list for select/radio input. There are situations when options list is only known after it it fetched
 * from API, it can not be included in form definition variable. In such situations options list is to be passed to component using
 * component property
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
  optionsForSelectOrRadioFields,
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

  //errors displayed on initial or any subsequent render, those are not validation errors but might be errors received from REST API af
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

    const initialFormDataCorrectedTypes: SubmittedFormData = {};

    for (const [fieldName, fieldDefinition] of Object.entries(formFieldsDefinition)) {
      
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

      //convert prepared value to runtime type according to html input field type
      if (fieldDefinition.type === "checkbox") {
        //set boolean type value for checkbox, coercing non boolean value to boolean
        initialFormDataCorrectedTypes[fieldName] = Boolean(initialFieldValue);

      } else {
        //for all other fields convert initial value if set to a string type
        initialFormDataCorrectedTypes[fieldName] = String(initialFieldValue);
      }

    }

    //finally set corrected data to state
    setInputFieldValues(initialFormDataCorrectedTypes);


  }, [initialFormData]);


  /*if default prompt option of select input element is disabled and initial value for this field is not provided in initial form data then
  state variable that contains controlled input fields values has empty string value for this field but in the mean time select box displays
  as it's selected option an option (label and value) taken from first element of current field's definition 'options' array with possibly
  non empty value. Displayed option and appropriate state variable field values will not match if user does not change select field's
  value and form is submitted as empty value instead of actually selected will be passed to submitted data callback, also non empty
  validation rule if present for current field would not pass. In described situation take initial value from field's definition first
  option and set it to state variable that maintains controlled input fields values*/
  useEffect(() => {
    const initialFormDataForSelectFields: SubmittedFormData = {};

    for (const [fieldName, fieldDefinition] of Object.entries(formFieldsDefinition)) {

      if (fieldDefinition.type === "select" &&
        fieldDefinition.hidePropmtOption === true) {
        //TODO improve comment
        //in case hook executes after first display then inputFieldValues state var is not populated with value yet by previous hook, must
        //check if initial value for field is provided in 'initialFormData' property - it must be present and not be null.
        //This hook can execute also after any subsequent render as form definition can be changed f.e. for adding or disabling field

        //initial data for field is provided if value for current field in initialFormData property is present (not undefined) and it's
        //value is not null (actual value is a number, string or boolean type value)
        const isFieldInitialDataProvided =
          initialFormData !== undefined &&
          initialFormData !== null &&
          initialFormData[fieldName] !== undefined &&
          initialFormData[fieldName] !== null

        //assign initial data for current field only if value for appropriate field in fields state variable is undefined. Field for
        //current field in state variable will be undefined after first render (previous hook populated values is not in state yet)
        //or when a select/radio field is added to form definition at some subsequent render.
        //But it will be other than undefined if select/radio field was present, then was removed and then added again (possible there will
        //be needed such logic) - it will have same selected value as before removing from form
        //as it was before removing
        if (isFieldInitialDataProvided === false &&
          inputFieldValues[fieldName] === undefined) {


          const options: InputOptionsList = getOptionsListForInputField(fieldName, optionsForSelectOrRadioFields)
          //get value from first option's array element and set it as initial data for field.
          //Theoretically there may be situations that programmer does not provide options list neither in form definition nor in component
          //prop therefore options lenght zero check to avoid runtime error (options list will be empty)
          if(options.length > 0){
            const [firstOptionData] = options
            initialFormDataForSelectFields[fieldName] = String(firstOptionData.value)
          }
        }
      }
    }

    //merge current field values with corrected select input field values object
    setInputFieldValues(prevState => ({...prevState, ...initialFormDataForSelectFields}))

  }, [formFieldsDefinition]);


  /**
   * Returns list of options for specified select/radio input field.
   * Intented to be invoked in loops that process input fields info when a select/radio input field is encauntered
   * 
   * @param fieldName - name of a select/radio input field for which to retrieve options list from {@link optionsForSelectOrRadioFields}
   * parameter containing options for all select/radio input fields
   * @param optionsForSelectOrRadioFields - options for all select/radio input fields, parameter value must be received from component's
   * prop containing options for all select/radio input fields
   * @returns - list of objects, each object containing a dedicated field for single option value and label
   * 
   * @throws error if {@link optionsForSelectOrRadioFields} parameter does not contain options for specified field name thus not letting
   * create a select/radio input field if options list is not provided
   */
  function getOptionsListForInputField(
    fieldName: string,
    optionsForSelectOrRadioFields?: OptionsForInputFields | null): InputOptionsList {

    if(optionsForSelectOrRadioFields &&
      fieldName in optionsForSelectOrRadioFields){

      return optionsForSelectOrRadioFields[fieldName]

    }else{
      throw new Error(`Options list for [${fieldName}] field are not specified!`)
    }
  }


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
  const onInputFieldsChange = (event: InputChangeEventTypes) => {
    const name = event.target.name;

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

    for (const [fieldName, fieldDefinition] of Object.entries(formFieldsDefinition)) {
      //if validation rules are absent for this field, go to next field
      if (!Array.isArray(fieldDefinition.validationRules)) {
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
      fieldDefinition.validationRules.forEach((validatRulesObj) => {

        //rule "required" - don't allow empty string
        //fieldValue will be undefined if input field was not assigned default value and was not changed anyway (change 
        //handler did not mofify appropriate prop in inputFieldValues object). 
        if (validatRulesObj.rule === "required" &&  (fieldValue === undefined || String(fieldValue).trim() === "")) {
          const defaultErrMsg = "this field must not be empty";

          //use error message from form definition if it is set
          errMsgForCurrentField = validatRulesObj.message ? validatRulesObj.message : defaultErrMsg;


          //rule "minLength" - don't allow shorter than string length than defined in rule's "value" field.
          //If field is empty string, create error message that field must not be empty and minimal length that 
          //string should be, if string is not empty and too short, create error message that field value's length
          //should not be shorter than specified in rule
        } else if (validatRulesObj.rule === "minLength") {
          const fieldValueMinLength = parseInt(String(validatRulesObj.value));

          if (fieldValue === undefined || String(fieldValue).trim().length < fieldValueMinLength) {
            const defaultErrorMsg = `field's length must be at least ${fieldValueMinLength} 
                symbol${fieldValueMinLength > 1 ? "s" : ""}`;

            //use error message from form definition if it is set
            errMsgForCurrentField = validatRulesObj.message ? validatRulesObj.message : defaultErrorMsg;

          }

          //rule "email" - must be valid email format string
        }else if(validatRulesObj.rule === "email"){
          const inputTrimmedLoverCase = String(fieldValue).trim().toLowerCase();
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
          setInitialErrors((prevInitialErrors) => {
            delete prevInitialErrors[fieldName]
            return prevInitialErrors
          })
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


  //on first render return null preventing running loop that creates all fields markup as first render will be followed by hook run that
  //sets initial data for state variable that keeps values of controlled input fields and second render will happen which displays fields
  //with initial data. (On first render state variable is empty object, not even empty string or false boolean values)
  if(Object.entries(inputFieldValues).length === 0){
    return null
  }

  return (
    <form onSubmit={handleSubmit} className="form_builder">
      {Object.entries(formFieldsDefinition).map(([fieldName, fieldDefinition]) => {
        const fieldValue = inputFieldValues[fieldName];


        //Adding attributes present in all input elements.
        //All input elements also have change handler as they are controlled input fields
        const inputElemAttributes: InputElementAttributes = {
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
        if (fieldDefinition.type === "checkbox") {
          inputElemAttributes.checked = Boolean(fieldValue);

        } else {
          inputElemAttributes.value = String(fieldValue);
        }


        if (fieldDefinition.type === "checkbox" && checkboxCssCls) {
            inputElemAttributes.className = checkboxCssCls;
        }

        //TODO - add code for "<input type='number'/>, possibly it has requires more options than currently for other <input> "type" attributes
        let inputTag;
        if (fieldDefinition.type === "text" ||
          fieldDefinition.type === "checkbox" ||
          fieldDefinition.type === "hidden" ||
          fieldDefinition.type === "password") {
          inputElemAttributes.type = fieldDefinition.type;
          inputTag = <input {...inputElemAttributes} />;


        } else if (fieldDefinition.type === "textarea") {
          inputTag = <textarea {...inputElemAttributes} />;


        } else if(fieldDefinition.type === "select"){

          let optionsList: InputOptionsList = []

          //Add as a first option a prompt option unless it is not disabled by field definition. A prompt option value is empty
          //string "" and label is "Select...", it acts as prompt for input.
          if(fieldDefinition.hidePropmtOption !== true){

            //Default "Select..." label can be overriden by text value from field definition if it's value it non empty string
            const promptOptionLabel = fieldDefinition.promptLabelOverride ? fieldDefinition.promptLabelOverride : "Select..."

            optionsList.push({
              value: "",
              label: promptOptionLabel
            })
          }

          //add the actual options list an array with possibly added prompt input
          optionsList  = [
            ...optionsList,
            ...getOptionsListForInputField(fieldName, optionsForSelectOrRadioFields)
          ]

          inputTag = <select {...inputElemAttributes}>
            {/*using the 'value' property of option list element as 'key' attribute when outputting options list. Assuming that select
            option values are unique values, there should not be situation to add identical values to more than one option*/}

            {optionsList.map(({ value, label }) =>
              <option
                key={value}
                value={value}>{label}</option>
            )}
          </select>


      } else if(fieldDefinition.type === "radio"){
        let optionsList: InputOptionsList = getOptionsListForInputField(fieldName, optionsForSelectOrRadioFields)

        {/*using the 'value' property of radio option list element as 'key' attribute when outputting label with radio input elements.
          Assuming that radio input element values are unique values, there should not be situation to add identical values to more than one
          distinct radio input*/}
        inputTag = optionsList.map(({value, label}) =>
          <label key={value}>
            <input
              type="radio"
              name={fieldName}
              value={value}
              checked={value === fieldValue}
              onChange={onInputFieldsChange}
              disabled={disableAllFields === true}/>{label}
          </label>
        )
      }

        /**
         * input tag is created, it must be wrapped and label tag placed before or after input depending whether it is checkbox input
         * or not; hidden input elements are not wrapper and no label attached with it
         */

        //the 'hidden' type input tag is returned here as it has no label tag attached or any wrapping.
        //Also add 'key' attribute (for other input field and label 'key' attribute is added to wrapper element)
        if (fieldDefinition.type === "hidden") {
          return <input {...inputElemAttributes} key={fieldName} />;
        }

        //for all input tags except checkbox, label comes before input field. Checkbox input is followed by empty div to have possibility
        //to create custom checkbox style using css, it always has class name 'checkmark' present and appended class names from component
        //property if it is not empty. Input tag and "checkmark" div is placed inside label tag to make click on "checkmark" div detectable
        //in input when clicking on it
        let inputTagWithLabel;
        if (fieldDefinition.type === "checkbox") {
          inputTagWithLabel =
            <label htmlFor={fieldName}>
              <div>
                {inputTag}
                {/*div for creating custom styled checkbox*/}
                <div className={'checkmark ' + (checkboxFollwingSiblingCssCls ? checkboxFollwingSiblingCssCls : '')}></div>
              </div>
              {fieldDefinition.label}
            </label>;

        } else {
          inputTagWithLabel =
            <>
              <label htmlFor={fieldName}>{fieldDefinition.label}</label> {inputTag}
            </>;
        }

        return (
          <div className={"field " + fieldDefinition.type} key={fieldName}>
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
