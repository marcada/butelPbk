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
            $carouselPath = '/storage/' . $request->file('carousel_image')->store('ads/carousel', 'public');
        }
        if ($request->hasFile('sidebar_image')) {
            $sidebarPath = '/storage/' . $request->file('sidebar_image')->store('ads/sidebar', 'public');
        }
        if ($request->hasFile('billboard_image')) {
            $billboardPath = '/storage/' . $request->file('billboard_image')->store('ads/billboard', 'public');
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
            'business_id' => $request->business_id, // Ensure business_id is saved if passed
        ]);

        return response()->json($ad, 201);
    }

    public function update(Request $request, $id)
    {
        $ad = Advertisement::findOrFail($id);

        // 1. Validation
        $request->validate([
            'client_name' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'type_carousel' => 'required|boolean',
            'type_sidebar' => 'required|boolean',
            'type_billboard' => 'required|boolean',
            // Images are optional on update
            'carousel_image' => 'nullable|image|max:2048',
            'sidebar_image' => 'nullable|image|max:2048',
            'billboard_image' => 'nullable|image|max:2048',
        ]);

        // 2. Handle File Replacements
        if ($request->hasFile('carousel_image')) {
            if ($ad->carousel_image_path) {
                $relativePath = str_replace('/storage/', '', $ad->carousel_image_path);
                Storage::disk('public')->delete($relativePath);
            }
            $ad->carousel_image_path = '/storage/' . $request->file('carousel_image')->store('ads/carousel', 'public');
        }

        if ($request->hasFile('sidebar_image')) {
            if ($ad->sidebar_image_path) {
                $relativePath = str_replace('/storage/', '', $ad->sidebar_image_path);
                Storage::disk('public')->delete($relativePath);
            }
            $ad->sidebar_image_path = '/storage/' . $request->file('sidebar_image')->store('ads/sidebar', 'public');
        }

        if ($request->hasFile('billboard_image')) {
            if ($ad->billboard_image_path) {
                $relativePath = str_replace('/storage/', '', $ad->billboard_image_path);
                Storage::disk('public')->delete($relativePath);
            }
            $ad->billboard_image_path = '/storage/' . $request->file('billboard_image')->store('ads/billboard', 'public');
        }

        // 3. Update other fields
        $ad->update([
            'client_name' => $request->client_name,
            'title' => $request->title,
            'type_carousel' => $request->boolean('type_carousel'),
            'type_sidebar' => $request->boolean('type_sidebar'),
            'type_billboard' => $request->boolean('type_billboard'),
            // Image paths are already updated on the model instance above if files were uploaded
        ]);

        return response()->json($ad);
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
