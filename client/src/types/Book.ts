export type Book = {
  id: number,
  title: string,
  author: string,
  //'preface' property can also have null value in case receiving such value over REST API from backend which originates from null value of
  //corresponding column in database
  preface: string | null,
  //property name is in snake case as REST API sends JSON object with property name same as database table column name which are in snake
  //case
  added_to_favorites?: boolean
}

export type NewBook = Omit<Book, 'id'>
