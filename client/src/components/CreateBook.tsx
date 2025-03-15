import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { bookCreated } from "../features/booksSlice";
import { routes } from "../config";
import { FormBuilder } from '../utils/FormBuilder';
import store from "../store/store";
import { setPageTitleTagValue } from "../utils/setPageTitleTagValue";
import { Book } from "../types/Book";


function CreateBook() {
  const [createdBook, setCreatedBook] = useState<Book | null>(null);

  useEffect(() => {
    setPageTitleTagValue("Create new book");
  }, []);

  let  formFieldsDefinition = [
    {label: "Title", name:"title", type:"text", rule:"required"}, 
    {label: "Description", name:"description", type:"textarea", rule:"required"}];
    
  function saveSubmittedData(submittedData:{[index: string]: number | string | boolean}){
    let bookData = submittedData as Book;
    store.dispatch(bookCreated(bookData));
    setCreatedBook(bookData);
  }

  let mainContent;
  if( ! createdBook){
    mainContent = 
      <FormBuilder  formFieldsDefinition={formFieldsDefinition} 
                    successfulSubmitCallback={saveSubmittedData}/>;
  }else{
    mainContent = (
      <>
        <div className="info_message">Book data was saved.</div>
        <div className="table">
          <div className="row">
            <div>Title:</div>
            <div>{createdBook.title}</div>
          </div>
          <div className="row">
            <div>Description:</div>
            <div>{createdBook.description}</div>
          </div>
        </div>
        <div className="navigation"><Link to={routes.bookListPath}>Return to book list</Link></div>
      </>
    );
  }

  return  (
    <div className="create_book">
      <div className="navigation">
        <Link to={routes.bookListPath}>Back</Link>
      </div>
      
      <h2>Add book</h2>
      {mainContent}
    </div>
  )
}


export default CreateBook;