<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Display;
use App\Models\Campaign;
use App\Models\TimeZone;

class SimulationController extends Controller
{
    public function init()
    {
        return response()->json([
            'displays' => Display::all(),
            'server_time' => now()->toDateTimeString(),
        ]);
    }

    public function activeAd(Request $request)
    {
        // NEW LOGIC: Fetch from the new 'advertisements' table used by the CMS
        // Prioritize: type_billboard = true AND billboard_image_path exists
        $cmsAds = \App\Models\Advertisement::where('type_billboard', true)
            ->whereNotNull('billboard_image_path')
            ->orderBy('id', 'asc') // Consistent ordering
            ->get();

        if ($cmsAds->isNotEmpty()) {
            // Calculate time slot for deterministic rotation (20 seconds per ad)
            $time = \Carbon\Carbon::parse($request->input('timestamp', '12:00:00'));
            $secondsSinceMidnight = $time->secondsSinceMidnight();

            // 5 second duration
            $duration = 5;
            $slotIndex = floor($secondsSinceMidnight / $duration);

            // Cycle through ads
            $adIndex = $slotIndex % $cmsAds->count();
            $cmsAd = $cmsAds[$adIndex];

            return response()->json([
                'ad' => [
                    'id' => $cmsAd->id,
                    'name' => $cmsAd->title,
                    'type' => 'image',
                    // Pass the raw path (e.g., /storage/covers/...)
                    'billboard_image_path' => $cmsAd->billboard_image_path,
                    // Fix content_path for legacy support (avoiding double storage prefix)
                    'content_path' => 'http://localhost:8000' . $cmsAd->billboard_image_path,
                    'duration' => $duration
                ],
                'source' => 'cms_advertisements',
                'debug_slot' => $slotIndex
            ]);
        }

        // FALLBACK: Old Logic (Campaigns)
        $timeStr = $request->input('timestamp', '12:00:00'); // HH:MM:SS
        $dateStr = $request->input('date', now()->toDateString());

        // 1. Identify active TimeZones
        $activeTimeZones = TimeZone::whereTime('start_time', '<=', $timeStr)
            ->whereTime('end_time', '>=', $timeStr)
            ->pluck('id');

        // 2. Find eligible Campaigns
        $campaigns = Campaign::where('start_date', '<=', $dateStr)
            ->where('end_date', '>=', $dateStr)
            ->when($activeTimeZones->isNotEmpty(), function ($query) use ($activeTimeZones) {
                $query->whereHas('timeZones', function ($q) use ($activeTimeZones) {
                    $q->whereIn('time_zones.id', $activeTimeZones);
                });
            })
            ->with('ad')
            ->get();

        // 3. Select One Deterministically
        if ($campaigns->isEmpty()) {
            return response()->json([
                'ad' => null,
                'message' => 'No active campaigns or CMS ads.',
                'timestamp' => $timeStr
            ]);
        }

        // Calculate time slot for deterministic rotation (5 seconds per ad)
        $time = \Carbon\Carbon::parse($timeStr);
        $secondsSinceMidnight = $time->secondsSinceMidnight();
        $duration = 5;
        $slotIndex = floor($secondsSinceMidnight / $duration);

        // Cycle through campaigns
        $campaignIndex = $slotIndex % $campaigns->count();
        $selected = $campaigns[$campaignIndex];

        return response()->json([
            'ad' => $selected->ad,
            'campaign_id' => $selected->id,
            'debug_active_zones' => $activeTimeZones,
            'debug_slot' => $slotIndex
        ]);
    }
}
