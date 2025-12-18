<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

use App\Http\Controllers\SimulationController;
Route::get('/init', [SimulationController::class, 'init']);
Route::get('/active-ad', [SimulationController::class, 'activeAd']);

use App\Http\Controllers\AdminController;
Route::get('/admin/ads', [AdminController::class, 'getAds']);
Route::post('/admin/ads', [AdminController::class, 'createAd']);
Route::get('/admin/time-zones', [AdminController::class, 'getTimeZones']);
Route::post('/admin/campaigns', [AdminController::class, 'createCampaign']);
Route::get('/admin/campaigns', [AdminController::class, 'getCampaigns']);

use App\Http\Controllers\DashboardController;
Route::get('/admin/stats', [DashboardController::class, 'stats']);

Route::apiResource('categories', \App\Http\Controllers\CategoryController::class);
Route::apiResource('posts', \App\Http\Controllers\PostController::class);
Route::apiResource('events', \App\Http\Controllers\EventController::class);
Route::apiResource('advertisements', \App\Http\Controllers\AdvertisementController::class);
Route::apiResource('packages', \App\Http\Controllers\PackageController::class);
