export type Book = {
  id: number,
  title: string,
  author: string,
  preface: string | null,
  isAddedToFavorites?: boolean
}
