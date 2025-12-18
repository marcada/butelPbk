<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Campaign extends Model
{
    use HasFactory;

    protected $fillable = ['ad_id', 'start_date', 'end_date', 'appearances_total', 'appearances_used'];

    public function ad()
    {
        return $this->belongsTo(Ad::class);
    }

    public function timeZones()
    {
        return $this->belongsToMany(TimeZone::class);
    }
    //
}
