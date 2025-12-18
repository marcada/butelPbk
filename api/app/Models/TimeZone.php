<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Campaign;

class TimeZone extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'start_time', 'end_time', 'multiplier'];

    public function campaigns()
    {
        return $this->belongsToMany(Campaign::class);
    }
}
