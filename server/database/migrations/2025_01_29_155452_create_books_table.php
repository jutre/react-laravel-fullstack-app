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
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('author');
            $table->text('preface')->nullable();
            //user can add to favorites only his own book(s), use a boolean field on book record inself, by default not added to favorites
            $table->boolean('is_favorite')->default(false);
            $table->timestamps();
            $table->unsignedBigInteger('user_id');

            //'books' table 'user_id' column is foreing key to 'users' table primary key, 'books' and 'users' table has "one to many" 
            //relation.
            $table->foreign('user_id')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
