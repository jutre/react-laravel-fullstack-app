<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        /*get inserted userId, it's value will be used when inserting records in books table "user_id" column as it is a foreign key 
        referencing users.id*/
        $userId = DB::table('users')->insertGetId([
            'name' => 'John Doe',
            'email' => 'john.doe@example.com',
            'password' => \Illuminate\Support\Facades\Hash::make("password")
        ]);

        $booksDataArr = [];
        for($i = 1; $i <= 10; $i++){
            $booksDataArr[] = [
                "title" => "Book $i",
                "author" => "author $i",
                "preface" => "preface for book $i",
                "user_id" => $userId
            ];
        }

        DB::table('books')->insert($booksDataArr);
    }
}
