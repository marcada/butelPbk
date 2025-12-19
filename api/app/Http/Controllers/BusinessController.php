<?php

namespace App\Http\Controllers;

use App\Models\Business;
use Illuminate\Http\Request;

class BusinessController extends Controller
{
    public function index()
    {
        return Business::with('package')->latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'categories' => 'required|array',
            'categories.*' => 'string',
            'location' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'package_id' => 'required|exists:packages,id',
            'contact_email' => 'nullable|email',
            'contact_phone' => 'nullable|string',
            'image' => 'nullable|image|max:10240', // 10MB max
            'ads.*' => 'nullable|image|max:10240', // Validate each ad file
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('business_images', 'public');
            $validated['image_path'] = '/storage/' . $path;
        }

        $business = Business::create($validated);

        // Handle Billboard Ads
        if ($request->hasFile('ads')) {
            foreach ($request->file('ads') as $adFile) {
                $path = $adFile->store('advertisements', 'public');
                $fullPath = '/storage/' . $path;

                $business->advertisements()->create([
                    'client_name' => $business->name,
                    'title' => 'Автоматска Реклама',
                    'package_type' => 'web_plus_billboard',
                    'billboard_image_path' => $fullPath,
                    // 'web_image_path' => $fullPath, // Optional: use for web too
                ]);
            }
        }

        return response()->json($business, 201);
    }

    public function show(Business $business)
    {
        return $business->load('package');
    }

    public function update(Request $request, Business $business)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'categories' => 'sometimes|array',
            'location' => 'nullable|string',
            'package_id' => 'sometimes|exists:packages,id',
        ]);

        $business->update($validated);

        return response()->json($business);
    }

    public function destroy(Business $business)
    {
        $business->delete();
        return response()->noContent();
    }
}
