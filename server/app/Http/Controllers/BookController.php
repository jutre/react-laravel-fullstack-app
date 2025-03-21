<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\Request;
use App\Models\User;

class BookController extends Controller
{
    /**
     * return all books belonging to current user
     */
    public function index(Request $request)
    {
        usleep(400000);
        $currentlyLoggedInUserId = $this->getCurrentlyLoggedInUserId($request);
        return $this->getBookQueryWithUserIdConstraint($currentlyLoggedInUserId)
            ->select(['id', 'author', 'title'])
            ->get();
    }

    /**
     * Store a submitted book.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required',
            'author' => 'required'
        ]);
        usleep(500000);

        //a book with same title among books belonging to user must not exist. If exists, return error message, not creating book
        $currentlyLoggedInUserId = $this->getCurrentlyLoggedInUserId($request);
        $bookWithSameTitle = $this->getBookQueryWithUserIdConstraint($currentlyLoggedInUserId)
            ->where('title', $request->input('title'))
            ->select(['id'])
            ->first();
        if (!empty($bookWithSameTitle)) {
            $generalMessage = "Book with title \"{$request->input('title')}\" already exists";
            $error = [
                'message' => $generalMessage,
                'errors' => ['title' => ["Book with title \"{$request->input('title')}\" adready exists"]]
            ];
            return response()->json($error, 409);
        }

        //book is stored to database using model's object relation methods. This is done because books.user_id field can not be added to
        //mass assignment fields to prevent storing arbitrary user_id by submitting it from API
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
    public function show(Request $request, string $id)
    {
        usleep(100000);
        $currentlyLoggedInUserId = $this->getCurrentlyLoggedInUserId($request);
        $book = $this->getBookQueryWithUserIdConstraint($currentlyLoggedInUserId)
            ->where('id', $id)
            ->select(['id', 'title', 'author', 'preface'])
            ->first();

        //if book is not found, return error
        if (empty($book)) {
            return response()->json(['message' => "Book with id $id not found"], 404);
        }

        return $book;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        usleep(500000);

        //get book result object instance to use if for updating record later. 
        //select book by id adding book's user_id column value constraint to prevent accessing books belonging to other users (an ID of 
        //arbitrary book can be passed in REST API URL book id path segment, also of book belonging to other user)
        $currentlyLoggedInUserId = $this->getCurrentlyLoggedInUserId($request);
        $book = $this->getBookQueryWithUserIdConstraint($currentlyLoggedInUserId)
            ->where('id', $id)
            ->select(['id'])
            ->first();

        //if book is not found, return error
        if (empty($book)) {
            return response()->json(['message' => "Book with id $id not found"], 404);
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
     * This method corresponds to HTTP DELETE method which receives request body instead of having path segment in REST API endpoint URL 
     * corresponding to single deletable book id. Request body is JSON which is array of deletable books ids in 
     * form of {'ids': [1, 2, 3, ...other array elements]}
     */
    public function destroy(Request $request)
    {
        usleep(500000);
        $currentlyLoggedInUserId = $this->getCurrentlyLoggedInUserId($request);
        $this->getBookQueryWithUserIdConstraint($currentlyLoggedInUserId)
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
        $currentlyLoggedInUserId = $this->getCurrentlyLoggedInUserId($request);
        return $this->getBookQueryWithUserIdConstraint($currentlyLoggedInUserId)
            ->where('title', 'like', '%' . $title . '%')
            ->select(['id', 'title'])
            ->get();
    }


    /**
     * Returns Eloquent query builder instance with added 'where' condition which forces to query Book model's records that are only 
     * associated with passed user's id value, where user id must be id of currently logged in user as user is allowed to access and modify
     * only books created by user itself.
     * 
     * 'books' table 'user_id' column is foreing key to 'users' table primary key, 'books' and 'users' table has "one to many" relation.
     * Function returns Eloquent query builder instance and the function call can be followed by other Eloquent query builder method calls
     * allowing method calls chaining adding additional conditions and invoking retrieving methods, for example
     * return $this->getBookQueryWithUserIdConstraint($userId)->select(['column1', 'column2'])->get();
     *
     * @param int $request
     * @return \Illuminate\Database\Eloquent\Builder
     */
    private function getBookQueryWithUserIdConstraint(int $bookOwnerUserId)
    {
        return Book::where('user_id', $bookOwnerUserId);
    }

    /**
     * Returns currently logged in user's id field.
     *
     * @param \Illuminate\Http\Request $request
     * @return int
     */
    private function getCurrentlyLoggedInUserId(Request $request) {
        return $request->user()->id;
    }
}
