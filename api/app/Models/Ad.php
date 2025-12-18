<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ad extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'type', 'content_path', 'duration'];

    public function campaigns()
    {
        return $this->hasMany(Campaign::class);
    }
    //
}
