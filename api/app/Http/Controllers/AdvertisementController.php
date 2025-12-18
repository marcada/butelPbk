<?php

namespace App\Http\Controllers;

use App\Models\Advertisement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdvertisementController extends Controller
{
    public function index()
    {
        return Advertisement::latest()->get();
    }

    public function store(Request $request)
    {
        // 1. Validation
        $request->validate([
            'client_name' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            // At least one type must be selected
            'type_carousel' => 'required|boolean',
            'type_sidebar' => 'required|boolean',
            'type_billboard' => 'required|boolean',
            // Conditional Image Validation
            'carousel_image' => 'required_if:type_carousel,true|image|max:2048',
            'sidebar_image' => 'required_if:type_sidebar,true|image|max:2048',
            'billboard_image' => 'required_if:type_billboard,true|image|max:2048',
        ]);

        $carouselPath = null;
        $sidebarPath = null;
        $billboardPath = null;

        // 2. Uploads
        if ($request->hasFile('carousel_image')) {
            $carouselPath = $request->file('carousel_image')->store('ads/carousel', 'public');
        }
        if ($request->hasFile('sidebar_image')) {
            $sidebarPath = $request->file('sidebar_image')->store('ads/sidebar', 'public');
        }
        if ($request->hasFile('billboard_image')) {
            $billboardPath = $request->file('billboard_image')->store('ads/billboard', 'public');
        }

        // 3. Create
        $ad = Advertisement::create([
            'client_name' => $request->client_name,
            'title' => $request->title,
            'type_carousel' => $request->boolean('type_carousel'),
            'type_sidebar' => $request->boolean('type_sidebar'),
            'type_billboard' => $request->boolean('type_billboard'),
            'carousel_image_path' => $carouselPath,
            'sidebar_image_path' => $sidebarPath,
            'billboard_image_path' => $billboardPath,
        ]);

        return response()->json($ad, 201);
    }

    public function show($id)
    {
        return Advertisement::findOrFail($id);
    }

    public function destroy($id)
    {
        $ad = Advertisement::findOrFail($id);
        if ($ad->carousel_image_path)
            Storage::disk('public')->delete($ad->carousel_image_path);
        if ($ad->sidebar_image_path)
            Storage::disk('public')->delete($ad->sidebar_image_path);
        if ($ad->billboard_image_path)
            Storage::disk('public')->delete($ad->billboard_image_path);

        $ad->delete();

        return response()->json(null, 204);
    }
}
