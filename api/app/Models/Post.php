<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    protected $fillable = ['category_id', 'title', 'slug', 'content', 'image_path'];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
