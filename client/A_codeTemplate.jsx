import { useState, useEffect } from 'react';


export function ComponentUserEffectUseState(){
  const [value, setValue] = useState("local");
  
  useEffect(() => {
    
  }, []);
  

  function handleClick(event){
    let selectedValue = event.target.value;
    setValue(selectedValue);
  }

  return (
    <div className="className">
      <div className="className"
          onClick={handleClick}>
        nestedDiv:
      </div>

      <div className="className">
        {(value).map((entry, index) =>
          <div key={index}
            className="className">
              {entry.objField}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Imports Redux related selector, dispatch hooks, file from slices directory;
 * click hander, 
 * array iterator
 */
import { useAppDispatch, useAppSelector } from '../store/reduxHooks';
import { selectCurrentUser } from "../features/authSlice";

export function ComponentRedux_UseSELECTOR_UseDISPATCH(){
  const currentUser = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    
  }, []);
  

  function handleClick(event){
    let selectedValue = event.target.value;
    dispatch(selectedValue);
  }

  return (
    <div className="className">
      <div className="className"
          onClick={handleClick}>
        nestedDiv:
      </div>
      
      <div className="className">
        {(value).map((entry, index) =>
          <div key={index}
            className="className">
              {entry.objField}
          </div>
        )}
      </div>
    </div>
  )
}