<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class LiteraryGenresSeeder extends Seeder
{
    /**
     * Seeder for table that was created later during development. This class was invoked separatelly using db:seed command to seed table
     * 'literary_genres' after it's creation. Class run() metnod is invoked when running database seeding on fresh database from main
     * seeder class
     * 
     */
    public function run(): void
    {
        $genresArr = [
            ['title' => 'Novel'],
            ['title' => 'Fantasy'],
            ['title' => 'History'],
            ['title' => 'Science & technology']
        ];
        DB::table('literary_genres')->insert($genresArr);
    }
}
