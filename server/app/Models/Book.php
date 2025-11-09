<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\LiteraryGenre;
use App\Models\User;

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


    /**
     * a user the books belongs to
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * literary genre the books belongs to
     */
    public function literaryGenre(): BelongsTo
    {
        return $this->belongsTo(LiteraryGenre::class);
    }
}
