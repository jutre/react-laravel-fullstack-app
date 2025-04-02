export type Book = {
  id: number,
  title: string,
  author: string,
  preface: string | null,
}

export type NewBook = Pick<Book, 'title' | 'author' | 'preface'>

//favorite book cache in RTK Query cache will contain only 'id' field from book, it is needed to maintain only list of book ids to store
//favorite books list
export type FavoriteBook = Pick<Book, 'id'>
