<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\Request;

class BookController extends Controller
{
    /**
     * return all books belonging to current user
     */
    public function index(Request $request)
    {
        usleep(400000);
        return $this->getBookQueryWithUserIdConstraint($request)
            ->select(['id', 'author', 'title'])
            ->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required',
            'author' => 'required'
        ]);
        usleep(900000);
        return Book::create($request->all());
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

        $book = $this->getBookQueryWithUserIdConstraint($request)
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
        $book = $this->getBookQueryWithUserIdConstraint($request)
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
     * Remove records from books table. A record is deleted if it's 'id' column value is included in request body's JSON array where each 
     * array element is book id. Deleting is restricted to books belonging to current user logged in.
     * This method corresponds to HTTP DELETE method which receives
     * request body instead of having path segment in REST API endpoint URL corresponding to single deletable book id.
     * The body is JSON which is array of deletable books ids
     */
    public function destroy(Request $request)
    {
        usleep(500000);

        $this->getBookQueryWithUserIdConstraint($request)
            ->whereIn('id', $request->all())
            ->delete();

        return response()->noContent();
    }

    /**
     * search book by title among books belonging to current user logged in.
     */
    public function search(Request $request, string $title)
    {
        usleep(100000);
        return $this->getBookQueryWithUserIdConstraint($request)
            ->where('title', 'like', '%' . $title . '%')
            ->select(['id', 'title'])
            ->get();
    }


    /**
     * Returns Eloquent query builder instance with added 'where' condition which forces to query Book model's records that are only 
     * associated with currently logged in user. Business logic allows accessing books only created by current user.
     * 
     * 'books' table 'user_id' column is foreing key to 'users' table primary key, 'books' and 'users' table has "one to many" relation.
     * Function returns the query builder instance and the function call can be followed by other query builder method calls allowing
     * convenient method calls chaining adding additional conditions and calling retrieving methods, for example
     * return $this->getBookQueryWithUserIdConstraint($request)->select(['column1', 'column2'])->get();
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Database\Eloquent\Builder
     */
    private function getBookQueryWithUserIdConstraint(Request $request)
    {
        $loggedInUser = $request->user();
        return Book::where('user_id', $loggedInUser->id);
    }
}
