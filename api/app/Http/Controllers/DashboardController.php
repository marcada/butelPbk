<?php

namespace App\Http\Controllers;

use App\Models\Advertisement;
use App\Models\Event;
use App\Models\Post;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats()
    {
        return response()->json([
            'total_posts' => Post::count(),
            'active_events' => Event::where('date', '>=', now())->count(),
            'active_ads' => Advertisement::count(),
        ]);
    }
}
