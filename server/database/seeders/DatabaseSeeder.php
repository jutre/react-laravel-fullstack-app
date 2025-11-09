<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Database\Seeders\Helper;
use Database\Seeders\LiteraryGenresSeeder;

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

        $booksDataArr = Helper::getBookDataArray($userId);

        DB::table('books')->insert($booksDataArr);


        $this->call([
            LiteraryGenresSeeder::class,
        ]);
    }
}
