<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Advertisement extends Model
{
    protected $fillable = ['client_name', 'title', 'package_type', 'web_image_path', 'billboard_image_path', 'business_id'];

    protected $casts = [
        'type_carousel' => 'boolean',
        'type_sidebar' => 'boolean',
        'type_billboard' => 'boolean',
    ];
}
