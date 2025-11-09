<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


/**
 * Adding new column to 'books' table using migration that alters existing table to get experience with migration that modifies table
 * (althought it was possible to modify existing migration that creates 'books' table and run database creation from scratch as I was
 * developing app alone)
 */

return new class extends Migration
{
    /**
     * Add 'literary_genre_id' foreign key to 'books' table referencing 'literary_genres' table.
     * Allow foreign key column to contain NULL values as it is assumed that 'books' table is already filled with data when column is added
     * and to test function in frontend code that allows creating NULL values in form submitted data object working in conjunction with
     * FormBuilder React component 
     */
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->foreignId('literary_genre_id')->nullable(true)->constrained('literary_genres');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //when rollback latest migrations using "migrate:refresh", "migrate:rollback" then column 'books.literary_genre_id'
        //must be dropped by current migration as it must be done before dropping 'literary_genres' table
        //because 'books.literary_genre_id' is foreign key to 'literary_genres' table
        Schema::table('books', function (Blueprint $table) {
            $table->dropForeign('books_literary_genre_id_foreign');
            $table->dropColumn('literary_genre_id');
        });
    }
};
