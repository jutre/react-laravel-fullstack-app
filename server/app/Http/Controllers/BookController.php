<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class BookController extends Controller
{
    private $bookDataValidationRules = [
        'title' => 'between:3,255',
        'author' => 'between:3,255'
    ];

    /**
     * return all books belonging to current user
     */
    public function index(Request $request)
    {
        usleep(400000);
        return $this->getBooksTableQueryWithCurrentUserConstraint($request)
            ->select(['id', 'author', 'title'])
            ->get();
    }

    /**
     * Store a submitted book.
     */
    public function store(Request $request)
    {
        $request->validate($this->bookDataValidationRules);
        usleep(500000);

        //a book with same title among books belonging to user must not exist. If exists, return error message, don't create book

        $bookTitle = $request->input('title');
        if ($this->doesBookTitleExistAmongUsersBooks($request, $bookTitle)) {
            $error = $this->createDataForExistingTitleErrorResponse($bookTitle);
            return response()->json($error, 409);
        }

        //book is stored to database using model's object relation methods. This is done because books.user_id field can not be added to
        //mass assignment fields to prevent storing arbitrary user_id by submitting it from API
        $currentlyLoggedInUserId = $this->getCurrentlyLoggedInUserId($request);
        $user = User::find($currentlyLoggedInUserId);
        $book = new Book($request->all());
        $savedBookRecord = $user->books()->save($book);

        //select created book's data using new query specifying needed columns used in response JSON. The save() method does not
        //fit as it returns all fields from books table including created_at, update_at columns which are not needed
        return Book::find($savedBookRecord->id, ['id', 'title', 'author', 'preface']);
    }

    /**
     * Select book by id.
     * 
     * Method adds book's user_id column value constraint to sql query to prevent accessing books belonging to other user (an ID of 
     * arbitrary book id can be passed in REST API URL book id path segment, also of book belonging to other user)
     * 
     */
    public function show(Request $request, int $id)
    {
        usleep(100000);
        $book = $this->getBooksTableQueryWithCurrentUserConstraint($request)
            ->where('id', $id)
            ->select(['id', 'title', 'author', 'preface'])
            ->first();

        //if book is not found, return error
        if (empty($book)) {
            return $this->createBookWithIdNotFoundResponseBodyAndCode($id);
        }

        return $book;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate($this->bookDataValidationRules);
        usleep(500000);

        //get book result object instance to use if for updating record later. 
        //select book by id adding book's user_id column value constraint to prevent accessing books belonging to other users (an ID of 
        //arbitrary book can be passed in REST API URL book id path segment, also of book belonging to other user)

        $book = $this->getBooksTableQueryWithCurrentUserConstraint($request)
            ->where('id', $id)
            ->select(['id', 'title'])
            ->first();

        //if book is not found, return error
        if (empty($book)) {
            return $this->createBookWithIdNotFoundResponseBodyAndCode($id);
        }

        //if user is setting new title for book, check if such title is set for other book
        //can not update to a title if a book with title user is attempting to update to exists among books belonging to user, book titles
        //are unique among user's book. If exists, return error message, don't create book
        $newBookTitle = $request->input('title');
        if($newBookTitle != $book->title){
            if ($this->doesBookTitleExistAmongUsersBooks($request, $newBookTitle)) {
                $error = $this->createDataForExistingTitleErrorResponse($newBookTitle);
                return response()->json($error, 409);
            }
        }

        $book->update($request->all());


        //select updated book's data using new query specifying needed columns used in response JSON. The $book->refresh() method does not
        //fit as it returns all fields from table including created_at, update_at columns which are not needed.
        //books.user_id field is not added to where clause as current code is not reached if first query with 'user_id' field constraint did
        //not return book belonging to current user
        $book = Book::find($id, ['id', 'title', 'author', 'preface']);

        return $book;
    }

    /**
     * Delete records from books table. A record is deleted if it's 'id' column value is included in request body's JSON array where each 
     * array element is book id. Deleting is restricted to books belonging to current user logged in.
     * 
     * This method corresponds to HTTP DELETE method but instead of having path segment in API endpoint URL containing single deletable
     * resource identifier, this method is constructed to receive request body which is a JSON containig array of deletable books ids. The
     * format of JSON should be in following format -
     * {
     *  "ids": [1, 2, 3, ...other array elements]
     * }
     */
    public function destroy(Request $request)
    {
        usleep(500000);

        //before deleting book(s) execute delete statement with deletable books identifiers in 'favorite_books' table. Possible deletable
        //books are added to favorites, records from 'favorite_books' table must be deleted before records from 'books' table as favorites
        //table contains foreign keys to books table
        $currentlyLoggedInUserId = $this->getCurrentlyLoggedInUserId($request);
        //start building query with 'favorite_books' table to delete from 'favorite_books' table (and only from this table)
        DB::table('favorite_books')
            ->join('books', 'favorite_books.book_id', '=', 'books.id')
            //belongs to current user
            ->where('books.user_id', $currentlyLoggedInUserId)
            //deletable books ids
            ->whereIn('id', $request->input('ids'))
            ->delete();

        //safely delete from 'books' table.
        $this->getBooksTableQueryWithCurrentUserConstraint($request)
            ->whereIn('id', $request->input('ids'))
            ->delete();

        return response()->noContent();
    }

    /**
     * search book by title among books belonging to current user logged in.
     */
    public function search(Request $request, string $title)
    {
        usleep(100000);
        return $this->getBooksTableQueryWithCurrentUserConstraint($request)
            ->where('title', 'like', '%' . $title . '%')
            ->select(['id', 'title'])
            ->get();
    }

    /**
     * returns JSON which is list containing book objects of books that are added to favorites by user currently logged in. 
     * Two distinct formats of JSON is returned depending on resource's URL query parameter's 'include_only_book_identifiers' value. If
     * parameters value is 'true' like 'https://path?include_only_book_identifiers=true' then book objects in JSON contains only 'id'
     * attritube,  JSON format is following -
     * [
     *   {"id":"<bookId1>"},
     *   {"id":"<bookId2>"},
     *   ...
     * ]
     * If 'include_only_book_identifiers' value is any other then "true" then book objects in JSON contain 'id', 'author', 'title',
     * 'preface' attribute, JSON format is following -
     * [
     *   {"id":"<bookId1>", "author":"<author>", "title":"<title>", "preface":"<preface>"},
     *   {"id":"<bookId2>", "author":"<author>", "title":"<title>", "preface":"<preface>"},
     *   ...
     * ]
     */
    public function getFavoriteBooks(Request $request)
    {
        usleep(100000);
        $selectedBookColumns = ['books.id', 'books.author', 'books.title', 'books.preface'];

        $includeOnlyBookIdentifiers = $request->string('include_only_book_identifiers')->trim()->toString();
        if($includeOnlyBookIdentifiers === 'true'){
            $selectedBookColumns = ['books.id'];
        }

        return $this->getBooksTableQueryWithCurrentUserConstraint($request)
            ->join('favorite_books', 'books.id', '=', 'favorite_books.book_id')
            ->select($selectedBookColumns)
            ->get();
    }

    /**
     * Adds a book specified by identifier to favorite book list.
     *
     * @param @param \Illuminate\Http\Request $request $request
     * @param integer $id - value of 'book' table 'id' column specifying book identifier which must be added to favorite book list
     * @return if book specified by id is successfully added to favorites list returns HTTP 204 response code (no content). If book is not
     * found, returns json with error description with HTTP 404 response code (not found); if book is already added to favorites, returns
     * json with error description with HTTP 409 response code (conflict)
     */
    public function addBookToFavorites(Request $request, int $id)
    {
        usleep(100000);

        //before adding to favorites, check 1)if book with such id exists in 'books' table (can not add to favorites a book that does not
        //exist among user's books), 2) if book already is added to favorites (trying to add a book already added to favorites must be
        //responded with error)
        $bookTableAndFavoriteTableRecord = $this->getBookTableRecordLeftJoinedWIthFavoriteBooksTable($request, $id);

        //if query result is empty, book with suplied id is not found, return error
        if (empty($bookTableAndFavoriteTableRecord)) {
            return $this->createBookWithIdNotFoundResponseBodyAndCode($id);
        }

        //if 'book_id' column (comes from 'favorite_books') from query result is not null book is adready added to favorites, return error
        if (!empty($bookTableAndFavoriteTableRecord->book_id)) {
            $error = [
                'message' => "Book with id $id is already added to favorites"
            ];
            return response()->json($error, 409);

        //record in joined 'favorite_books' table doesn't exists, book is not added to favorites. Add it by inserting record into
        //'favorite_books' table
        }else{
            DB::table('favorite_books')->insert([
                'book_id' => $id
            ]);
            return response()->noContent();
        }
    }


    public function removeBookFromFavorites(Request $request, int $id)
    {
        usleep(100000);

        //before removing from favorites, check 1)if book with such id exists in 'books' table (can not remove from favorites a book that
        //does not exist among user's books), 2) if book is not added to favorites (trying to remove a book not added added to favorites
        //will be respond with error)
        $bookTableAndFavoriteTableRecord = $this->getBookTableRecordLeftJoinedWIthFavoriteBooksTable($request, $id);

        //if query result is empty, book with suplied id is not found, return error
        if (empty($bookTableAndFavoriteTableRecord)) {
            return $this->createBookWithIdNotFoundResponseBodyAndCode($id);
        }

        //if 'book_id' column (comes from 'favorite_books') from query result is not null book is added to favorites, remove record from
        //favorites table
        if (!empty($bookTableAndFavoriteTableRecord->book_id)) {
            DB::table('favorite_books')
                ->where('book_id', '=', $id)
                ->delete();
            return response()->noContent();

        //record in joined 'favorite_books' table doesn't exists, book is not added to favorites, return 404 error
        }else{
            $error = [
                'message' => "Book with id $id is is not added to favorites"
            ];
            return response()->json($error, 404);
        }
    }

    /**
     * Returns object which is result of executed Eloquent query builder created SQL query. Query is select from 'books' table by book's id
     * and currently logged in user's id left joined with 'favorite_books' table. The result will be used to check record existance before
     * performing adding or removing record in 'favorite_books' table
     *
     * @param @param \Illuminate\Http\Request $request $request
     * @param integer $id - value of 'book' table 'id' column specifying book identifier which must be added to favorite book list
     * @return object - result of Eloquent query builder generated query. Null will be returned if record with specified book id does not
     * exist in 'books' table
     */
    private function getBookTableRecordLeftJoinedWIthFavoriteBooksTable(Request $request, int $bookId){
        return $this->getBooksTableQueryWithCurrentUserConstraint($request)
            ->leftJoin('favorite_books', 'books.id', '=', 'favorite_books.book_id')
            ->where('books.id', $bookId)
            ->select('books.id', 'favorite_books.book_id')
            ->first();
    }

    /**
     * Adds a book specified by identifier to favorite book list.
     *
     * @param @param \Illuminate\Http\Request $request $request
     * @param integer $id - value of 'book' table 'id' column specifying book identifier which must be added to favorite book list
     * @return if book specified by id is successfully added to favorites list returns HTTP 204 response code (no content). If book is not
     * found, returns json with error description with HTTP 404 response code (not found); if book is already added to favorites, returns
     * json with error description with HTTP 409 response code (conflict)
     */
    private function createBookWithIdNotFoundResponseBodyAndCode($bookId){
        return response()->json(['message' => "Book with id $bookId not found"], 404);
    }


    /**
     * Returns Eloquent query builder instance with called methods instructing to add SQL query parts "FROM books" and
     * "WHERE user_id = <currently logged in user ID>".
     * When user queries book list, makes updatates or deletes books, he can only access book records that were created therefore condition
     * on 'user_id' column will be needed in every SQL query performing reading, updating and deleting and this method add it to Eloquent
     * query builder instance along with "FROM books" part also needed in every query quering books data.
     * 
     * Function returns Eloquent query builder instance and the function call can be followed by other Eloquent query builder method calls
     * allowing method calls chaining adding additional conditions and invoking retrieving methods, for example
     * $this->getBooksTableQueryWithCurrentUserConstraint($request)
     *  ->select(['column1', 'column2'])
     *  ->get();
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Database\Eloquent\Builder
     */
    private function getBooksTableQueryWithCurrentUserConstraint(Request $request)
    {
        $currentlyLoggedInUserId = $this->getCurrentlyLoggedInUserId($request);
        return Book::where('books.user_id', $currentlyLoggedInUserId);
    }

    /**
     * Returns currently logged in user's id field.
     *
     * @param \Illuminate\Http\Request $request
     * @return int
     */
    private function getCurrentlyLoggedInUserId(Request $request)
    {
        return $request->user()->id;
    }

    /**
     * returns true if book with given title exists among user's created books
     *
     * @param \Illuminate\Http\Request $request
     * @param string $title
     * @return void
     */
    private function doesBookTitleExistAmongUsersBooks(Request $request, string $title){
        $bookByTitle = $this->getBooksTableQueryWithCurrentUserConstraint($request)
            ->where('title', $title)
            ->select(['id'])
            ->first();
        return !empty($bookByTitle);
    }


    /**
     * creates data structure using nested arrays which conforms to needed json structure which will be used to return json in error 
     * response containing message that book with given title already exists.
     *
     * @param string $title - title that is trying to be saved for book that already is used for existing book
     * @return array
     */
    private function createDataForExistingTitleErrorResponse(string $title){
        $generalMessage = "Book with title \"$title\" already exists";
        $error = [
            'message' => $generalMessage,
            'errors' => ['title' => [$generalMessage]]
        ];
        return $error;
    }


    /**
     * Resets data in 'books' and 'favorite_books' tables. All data from both tables are deleted and 10 records are inserted into 'books'
     * table referencing user with id=1
     * 
     * @return void
     */
    public function resetDemoData()
    {
        usleep(100000);
        DB::table('favorite_books')->delete();
        DB::table('books')->delete();

        //insert books records in empty 'books' table
        $booksDataArr = [];
        for($i = 1; $i <= 10; $i++){
            $booksDataArr[] = [
                "id" => $i,
                "title" => "Book $i",
                "author" => "author $i",
                "preface" => "preface for book $i",
                "user_id" => 1
            ];
        }
        DB::table('books')->insert($booksDataArr);

        return response()->noContent();
    }
}
