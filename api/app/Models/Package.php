<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Package extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'displays_per_showing',
        'duration',
        'shows_per_day',
        'price',
        'color',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'displays_per_showing' => 'integer',
        'duration' => 'integer',
        'shows_per_day' => 'integer',
    ];
}
