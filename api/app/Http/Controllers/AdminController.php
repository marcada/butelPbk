<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Ad;
use App\Models\Campaign;
use App\Models\TimeZone;

class AdminController extends Controller
{
    public function getAds()
    {
        return Ad::all();
    }

    public function createAd(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'type' => 'required|in:image,text',
            'content_path' => 'nullable|string', // URL or Text
            'image' => 'nullable|image|max:2048', // Max 2MB
            'duration' => 'required|integer'
        ]);

        $contentPath = $validated['content_path'] ?? null;

        // Handle Image Upload
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('ads', 'public');
            // Full URL for the frontend
            $contentPath = asset('storage/' . $path);
        }

        return Ad::create([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'content_path' => $contentPath ?? '', // Fallback if empty (should validate one is present)
            'duration' => $validated['duration']
        ]);
    }

    public function getTimeZones()
    {
        return TimeZone::all();
    }

    public function createCampaign(Request $request)
    {
        $validated = $request->validate([
            'ad_id' => 'required|exists:ads,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'appearances_total' => 'required|integer',
            'time_zone_ids' => 'required|array',
            'time_zone_ids.*' => 'exists:time_zones,id'
        ]);

        $campaign = Campaign::create([
            'ad_id' => $validated['ad_id'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['start_date'], // Demo simplification: single day or range
            'appearances_total' => $validated['appearances_total']
        ]);

        $campaign->timeZones()->attach($validated['time_zone_ids']);

        return $campaign->load('timeZones');
    }

    public function getCampaigns()
    {
        return Campaign::with(['ad', 'timeZones'])->orderBy('id', 'desc')->get();
    }
}
