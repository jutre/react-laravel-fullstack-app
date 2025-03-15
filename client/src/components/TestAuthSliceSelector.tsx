import { useAppSelector } from '../store/reduxHooks';
import { selectCurrentUser } from "../features/authSlice";


export function TestAuthSliceSelector(){

  const currentUser = useAppSelector(selectCurrentUser);
  return (
    
    <div className="className className">
      <div>{currentUser ? currentUser.name: "User is undefined"}</div>
      
    </div>
  )
}