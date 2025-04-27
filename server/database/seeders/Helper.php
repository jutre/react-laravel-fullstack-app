<?php

namespace Database\Seeders;

class Helper
{
    /**
     * creates book array with real book names where keys are column names in 'book' table. Intended to be used to seed database and for
     * demo data resetting.
     * 
     * @param $userIdColumnValue - value that will be assigned to books array element with 'user_id' key. Value must be id of existing 
     * record in 'users' table as 'user_id' column in 'books' table is a foreign key referencing 'id' column in 'users' table
     * @return array - array with book data to be used with query Eloquent query builder insert() method
     */
    public static function getBookDataArray(int $userIdColumnValue)
    {
        return [
            [
                'title' => 'Build Your Own Transistor Radios',
                'author' => 'Ronald Quan',
                'preface' => 'preface for book',
                'user_id' => $userIdColumnValue
            ],
            [
                'title' => 'Analysis and Design of Analog Integrated Circuits',
                'author' => 'Paul R. Gray',
                'preface' => 'preface for book',
                'user_id' => $userIdColumnValue
            ],
            [
                'title' => 'Transistor Circuit Techniques: Discrete and Integrated',
                'author' => 'Gordon J. Ritchie',
                'preface' => 'preface for book',
                'user_id' => $userIdColumnValue
            ],
            [
                'title' => 'The bipolar junction transistor',
                'author' => 'Gerold W. Neudeck',
                'preface' => 'preface for book',
                'user_id' => $userIdColumnValue
            ],
            [
                'title' => 'Principles of Transistor Circuits',
                'author' => 'Stanley William Amos',
                'preface' => 'preface for book',
                'user_id' => $userIdColumnValue
            ],
            [
                'title' => 'Transistor circuit design',
                'author' => 'John R. Miller',
                'preface' => 'preface for book',
                'user_id' => $userIdColumnValue
            ],
            [
                'title' => 'Electronics Transistor Basics',
                'author' => 'Prasun Barua',
                'preface' => 'preface for book',
                'user_id' => $userIdColumnValue
            ],
            [
                'title' => 'Electric-Double-Layer Coupled Oxide-Based Neuromorphic Transistors Studies',
                'author' => 'Changjin Wan',
                'preface' => 'preface for book',
                'user_id' => $userIdColumnValue
            ],
            [
                'title' => 'The Invention of the Transistor',
                'author' => 'Clara MacCarald',
                'preface' => 'preface for book',
                'user_id' => $userIdColumnValue
            ],
            [
                'title' => 'Field-Effect and Bipolar Power Transistor Physics',
                'author' => 'Adolph Blicher',
                'preface' => 'preface for book',
                'user_id' => $userIdColumnValue
            ],
        ];
    }
}
