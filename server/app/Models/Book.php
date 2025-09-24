<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'author',
        'preface',
        'is_favorite'
    ];

    //'is_favorite' is to be included as boolean type literal in serialized JSON instead of returned by default int literals 0 or 1
    protected $casts = [
        'is_favorite' => 'boolean',
    ];
}
