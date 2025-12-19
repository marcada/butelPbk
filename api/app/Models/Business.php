<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Business extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'categories',
        'location',
        'latitude',
        'longitude',
        'package_id',
        'image_path',
        'contact_email',
        'contact_phone',
    ];

    protected $casts = [
        'categories' => 'array',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    public function package()
    {
        return $this->belongsTo(Package::class);
    }

    public function advertisements()
    {
        return $this->hasMany(Advertisement::class);
    }
}
