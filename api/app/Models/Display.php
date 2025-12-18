<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Display extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'x', 'y', 'width', 'height'];
    //
}
