<?php
namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Models\LiteraryGenre;
use App\Models\User;
use Database\Seeders\Helper;


class BookController extends Controller
{
    //endpoints where all info about single book is returned (single book info, returned object after book creating, updating) includes same
    //set of columns
    private $singleBookInfoSelectedColumns = ['id', 'title', 'author', 'preface', 'is_favorite', 'literary_genre_id'];

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
     * Create a new book record together with record in favorite books table if book is marked as added to favorites.
     */
    public function store(Request $request)
    {
        $this->validateSubmBookData($request);
        usleep(500000);

        //a book with same title among books belonging to user must not exist. If exists, return error message,
        //don't create book
        $bookTitle = $request->input('title');
        if ($this->doesBookTitleExistAmongUsersBooks($request, $bookTitle)) {
            $error = $this->createDataForExistingTitleErrorResponse($bookTitle);
            return response()->json($error, 409);
        }

        $book = new Book($request->all());

        //associate Book with LiteraryGenre instance if literary genre is provided
        $book = $this->associateOrDisassociateLiteraryGenreWithBook($request, $book);

        //associate Book with User (creator of book)
        $currentlyLoggedInUserId = $this->getCurrentlyLoggedInUserId($request);
        $user = User::find($currentlyLoggedInUserId);
        $book->user()->associate($user);

        $book->save();

        return Book::select($this->singleBookInfoSelectedColumns)
            ->find($book->id);
    }

    /**
     * Select book by id.
     * 
     * In addition to selecting record by books.id column, query also is constrained by book.user_id column by value of currently logged in
     * user to prevent accessing books belonging to other user as in all endpoints user can only access books created by himself
     * 
     */
    public function show(Request $request, int $id)
    {
        usleep(100000);
        $bookRecord = $this->getBooksTableQueryWithCurrentUserConstraint($request)
            ->select($this->singleBookInfoSelectedColumns)
            ->where('id', $id)
            ->first();

        //if book is not found, return error
        if (empty($bookRecord)) {
            return $this->bookNotFoundErrorResponse($id);
        }

        return $bookRecord;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $this->validateSubmBookData($request);
        usleep(500000);

        $bookRecord = $this->getBooksTableQueryWithCurrentUserConstraint($request)
            ->where('id', $id)
            //include 'id' column to get working update() method of fetched model's object,
            //title' column to detect whether user is changing title
            ->select(['id', 'title'])
            ->first();

        //if book is not found, return error
        if (empty($bookRecord)) {
            return $this->bookNotFoundErrorResponse($id);
        }

        //if user is setting new title for book, check if such title is set for other book
        //can not update to a title if a book with title user is attempting to update to exists among books belonging to user, book titles
        //are unique among user's book. If exists, return error message, don't create book
        $newBookTitle = $request->input('title');
        if($newBookTitle != $bookRecord->title){
            if ($this->doesBookTitleExistAmongUsersBooks($request, $newBookTitle)) {
                $error = $this->createDataForExistingTitleErrorResponse($newBookTitle);
                return response()->json($error, 409);
            }
        }

        $bookRecord = $this->associateOrDisassociateLiteraryGenreWithBook($request, $bookRecord);

        $bookRecord->update($request->all());
        
        //can't use result object's refresh() method as it selects and returns all columns from model's table, but some are needed
        $bookAfterUpdate = Book::select($this->singleBookInfoSelectedColumns)
            ->find($id);

        return $bookAfterUpdate;
    }

    /**
     * Sets literary genre property on a passed Book model instance according to literary genreId JSON field value. Sets property to an
     * actual literary genre instance if genreId value is integer or to null if genreId value is null.
     * 
     * @param \Illuminate\Http\Request $request - used to get literary genre id JSON field value
     * @param App\Models\Book $book - Book model object
     * 
     * @return App\Models\Book - Book model object with literary genre association set depending on 'literary_genre_id' field value from
     * request
     * 
     * @throws Illuminate\Validation\ValidationException - throws exception if literary genre record with identifier suplied in
     * 'literary_genre_id' field value does not exist
     */
    function associateOrDisassociateLiteraryGenreWithBook(Request $request, Book $book){
        $genreId = $request->input('literary_genre_id');
        //associate Book with LiteraryGenre instance if 'literary_genre_id' is not null
        if ($genreId !== null) {
            $literaryGenreFromDb = LiteraryGenre::find($genreId);

            if (empty($literaryGenreFromDb)) {
                throw ValidationException::withMessages([
                    'literary_genre_id' => "Literary genre with id $genreId not found"
                ]);
            }

            $book->literaryGenre()->associate($literaryGenreFromDb);

        //set Book's literaryGenre property to null if passed genreId argument is null
        }else {
            $book->literaryGenre()->dissociate();
        }

        return $book;
    }


    /**
     * Delete records from books table. A record is deleted if it's 'id' column value is included in request body's JSON array where each 
     * array element is book id. Deleting is restricted to books belonging to current user logged in.
     * 
     * This method corresponds to REST API DELETE method but instead of having endpoint URL path segment corresponding to single deletable
     * book identifier this endpoint is constructed to receive request body which is a JSON containig array of deletable books ids. The
     * format of JSON should be in following format -
     * {
     *  "ids": [1, 2, 3, ...other book identifiers]
     * }
     */
    public function destroy(Request $request)
    {
        usleep(500000);

        $this->getBooksTableQueryWithCurrentUserConstraint($request)
            ->whereIn('id', $request->input('ids'))
            ->delete();

        return response()->noContent();
    }

    /**
     * returns books records which title contains search string optionally letting limit returned records count; search is performed among
     * books belonging to user currently logged in.
     * Function obtains search string from second function's input parameter which is set by Laravel according to URL path parameter
     * mapping which is mapped to current controller method; record limit count is obtained inside function's body from URL query parameter
     * 'limit'.
     * @param \Illuminate\Http\Request $request - used to get 'limit' URL query parameter's value
     * @param string $filterString - search string, must contain at least three symbols
     * @return array - accociative array which conforms to needed JSON structure that will be sent as response. Contains books records and
     * number of all 'books' table records where title contains search string. If 'limit' URL query parameter is set then contained book
     * records count will not exceed 'limit' parameter value. Returned array conforms to following JSON structure
     * 
     * TODO - fix output format description, its incorrect
     * {
     *  "data":[
     *      {"id":"<bookId1>", "author":"<author>", "title":"<title>", "preface":"<preface>"},
     *      {"id":"<bookId2>", "author":"<author>", "title":"<title>", "preface":"<preface>"},
     *      ...
     *  ],
     *  "total_rows_found": <row count>
     * }
     * 
     * Retuns error describing response if search string contains less than three symbols 
     */
    public function search(Request $request, string $filterString)
    {
        usleep(100000);
        //if search string too short send error message
        $filterString = trim($filterString);
        if(strlen($filterString) < 3){
            $error = [
                'message' => "Searching string must contain at least three symbols"
            ];
            return response()->json($error, 422);
        }

        //URL query param value less than 1 will be ignored further
        $limit = $request->integer('limit');

        //select record according to filtering string, do limiting returned row number if limit set
        $recordsQuery = $this->getBooksTableQueryWithCurrentUserConstraint($request)
            ->where('title', 'like', '%' . $filterString . '%')
            //TODO - add author column, it's missing in list view
            ->select(['id', 'title']);
        if($limit > 0){
            $recordsQuery = $recordsQuery->limit($limit);
        }
        $selectedRecords = $recordsQuery->get();


        $totalRowsNumber = 0;
        if($limit > 0){
            //count query
            $totalRowsNumber = $this->getBooksTableQueryWithCurrentUserConstraint($request)
            ->where('title', 'like', '%' . $filterString . '%')
            ->count();
        }else{
            $totalRowsNumber = count($selectedRecords);
        }

        $responseData = [
            'data' => $selectedRecords,
            'total_rows_found' => $totalRowsNumber
        ];
        return $responseData;
    }

    /**
     * returns JSON which is list containing book objects of books that are added to favorites by user currently logged in. 
     */
    public function getFavoriteBooks(Request $request)
    {
        usleep(100000);
        return $this->getBooksTableQueryWithCurrentUserConstraint($request)
            ->select(['id', 'author', 'title'])
            ->where('is_favorite', true)
            ->get();
    }


    /**
     * Remove a book specified by ID from user's favorite book list.
     *
     * @param \Illuminate\Http\Request $request $request
     * @param integer $id - value of 'book' table 'id' column specifying book identifier which must be removed from favorite books list
     * 
     * @return if book specified by id is successfully removed from favorites list returns HTTP 204 response code (no content). If book is
     * not found, returns json with error description and HTTP 404 response code (not found); if book is not currently added to favorites,
     * returns json with HTTP 404 response code (not found)
     */
    public function removeBookFromFavorites(Request $request, int $id)
    {
        usleep(100000);

        $bookRecord = $this->getBooksTableQueryWithCurrentUserConstraint($request)
            ->select(['id', 'is_favorite'])
            ->where('id', $id)
            ->first();

        //if query result is empty, book with passed ID is not found among user's books, return error
        if (empty($bookRecord)) {
            return $this->bookNotFoundErrorResponse($id);
        }

        //book is not added to favorites, return 404 error (trying to remove a book not added added to favorites)
        if ($bookRecord->is_favorite === false) {
            $error = [
                'message' => "Book with id $id is is not added to favorites"
            ];
            return response()->json($error, 404);
        }
        
        $bookRecord->update(['is_favorite' => false]);

        return response()->noContent();
    }

    public function getLiteraryGenresList()
    {
        return LiteraryGenre::select(['id', 'title'])
            ->orderBy('title', 'asc')
            ->get();
    }

    /**
     * validates submitted book data string fields length; in case literary genre ID is not null validates it to be in integer format
     *
     * @param Request $request
     * @return void
     * @throws
     */
    private function validateSubmBookData(Request $request)  {
        $request->validate([
            'title' => 'between:3,255',
            'author' => 'between:3,255'
        ]);
        if ($request->input('literary_genre_id')!== null) {
            $request->validate(['literary_genre_id' => 'integer']);
        }
    }

    /**
     * generates error response (JSON content and HTTP response code 404) for case that book is not found
     *
     * @param integer $bookId - book identifier
     * @return json with message that book does not exist and HTTP code 404
     */
    private function bookNotFoundErrorResponse($bookId){
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
        return Book::where('user_id', $currentlyLoggedInUserId);
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
    //TODO - return response object (json and response code like in bookNotFoundErrorResponse () method)
    private function createDataForExistingTitleErrorResponse(string $title){
        $generalMessage = "Book with title \"$title\" already exists";
        $error = [
            'message' => $generalMessage,
            'errors' => ['title' => [$generalMessage]]
        ];
        return $error;
    }


    /**
     * Resets data in 'books' table deleting all current data and inserting 10 records referencing record from 'users' table with id=1
     * 
     * @return void
     */
    public function resetDemoData()
    {
        usleep(100000);

        DB::table('books')->delete();

        //reset 'id' auto increment column to 1 using 'ALTER TABLE' statement instead of using 'TRUNCATE TABLE' as in case in future
        //any tables that have foreign keys referencing 'books' table will be created 'TRUNCATE TABLE books' will not be possible to be
        //executed doe to MySQL constraints
        DB::statement('ALTER TABLE `books` AUTO_INCREMENT = 1');

        //insert books records in empty 'books' table belonging to user with id=1
        $booksDataArr = Helper::getBookDataArray(1);
        DB::table('books')->insert($booksDataArr);

        return response()->noContent();
    }
}
