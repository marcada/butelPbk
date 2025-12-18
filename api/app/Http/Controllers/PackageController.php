<?php

namespace App\Http\Controllers;

use App\Models\Package;
use Illuminate\Http\Request;

class PackageController extends Controller
{
    public function index()
    {
        return Package::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'shows_per_day' => 'required|integer',
            'price' => 'required|numeric',
            'color' => 'required|string',
            'displays_per_showing' => 'required|integer',
            'duration' => 'required|integer',
        ]);

        $package = Package::create($validated);
        return response()->json($package, 201);
    }

    public function update(Request $request, $id)
    {
        $package = Package::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'shows_per_day' => 'sometimes|integer',
            'price' => 'sometimes|numeric',
            'color' => 'sometimes|string',
            'displays_per_showing' => 'sometimes|integer',
            'duration' => 'sometimes|integer',
        ]);

        $package->update($validated);

        return response()->json($package);
    }

    public function destroy($id)
    {
        Package::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
