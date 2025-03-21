export type Book = {
  id: number,
  title: string,
  author: string,
  preface: string | null,
  isAddedToFavorites?: boolean
}

export type NewBook = Pick<Book, 'title' | 'author' | 'preface'>
