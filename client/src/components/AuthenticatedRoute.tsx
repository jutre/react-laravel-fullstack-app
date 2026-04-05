import { Outlet } from "react-router-dom"
import { LoginForm } from "./LoginFormPrefilledCredentials"

type AuthenticatedRouteProps = {
    isAuthenticated: boolean,
}

/**
 * Component that works in conjunction with react-router <Route> component and lets display element which matches 'path' property value if
 * user is authenticated or login form if user is not authenticated.
 * 
 * Currrent component must be used with at least two levels of nested react-router <Route> components as shown in example below.
 * 
 * @example
 * ```tsx
 *  const isUserLoggenIn: boolean = isUserLoggenIn();
 * 
 *  content = (
 *      <Routes>
 *          <Route element={<AuthenticatedRoute isAuthenticated={isUserLoggenIn} />}>
 *              <Route path="protectedPathA" element={<ComponentA />} />
 *              <Route path="protectedPathB" element={<ComponentB />} />
 *          </Route>
 *          <Route path="unprotectedPath" element={<ComponentC />} />
 *      </Routes>
 *  )
 * ```
 * 
 * @param isAuthenticated - `true` to define that user is authenticated or `false` to define that user is not authenticated
 * 
 * @returns - element matching route if user is authenticated or login form component if user is not authenticated
 */

export function AuthenticatedRoute({ isAuthenticated }: AuthenticatedRouteProps) {
    if (isAuthenticated) {
        return <Outlet />
    } else {
        return <LoginForm />
    }
}
