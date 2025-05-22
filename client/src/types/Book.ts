export type Book = {
  id: number,
  title: string,
  author: string,
  preface: string | null,
  //property name is in snake case as REST api sends JSON object with properties which are equel to RDMS table column names which are in
  //snake case ('added_to_favorites' specifically does not came from table column name but in general JSON can contain properties conforming
  //to column names)
  added_to_favorites?: boolean
}

export type NewBook = Omit<Book, 'id'>

//favorite book cache in RTK Query cache will contain only 'id' field from book, it is needed to maintain only list of book ids to store
//favorite books list
export type FavoriteBook = Pick<Book, 'id'>
