<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('favorite_books', function (Blueprint $table) {
            /*User can add to favorites only books that are created by himself. To indicate that a book is added to
            favorites a record must be added to favorite_books table that references added book by book records's primary key*/
            $table->unsignedBigInteger('book_id');
            $table->foreign('book_id')->references('id')->on('books');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('favorite_books');
    }
};
