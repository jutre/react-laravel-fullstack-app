export type User = {
  id: number,
  name: string,
  email: string
}

/**
 * describes object type used to send username, password
 */
export type UserCredentials = {
  password: string,
  email: string
}
