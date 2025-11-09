export type Book = {
  id: number,
  title: string,
  author: string,
  //'preface' property can also have null value in case receiving such value over REST API from backend which originates from null value of
  //corresponding column in database
  preface: string | null,
  is_favorite?: boolean,
  literary_genre_id?: number | null
}

export type NewBook = Omit<Book, 'id'>
