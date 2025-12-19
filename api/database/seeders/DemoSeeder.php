<?php

namespace Database\Seeders;

use App\Models\Ad;
use App\Models\Campaign;
use App\Models\Display;
use App\Models\TimeZone;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // 0. Create Packages
        \App\Models\Package::create([
            'name' => 'Basic',
            'displays_per_showing' => 50,
            'duration' => 20,
            'shows_per_day' => 20,
            'price' => 400,
            'color' => '#10b981' // emerald-500
        ]);

        \App\Models\Package::create([
            'name' => 'Pro',
            'displays_per_showing' => 100,
            'duration' => 20,
            'shows_per_day' => 40,
            'price' => 700,
            'color' => '#f59e0b' // amber-500
        ]);

        \App\Models\Package::create([
            'name' => 'Enterprise',
            'displays_per_showing' => 200,
            'duration' => 20,
            'shows_per_day' => 80,
            'price' => 1200,
            'color' => '#6366f1' // indigo-500
        ]);

        // 1. Create Displays (Detected from slikata.png with HSV)
        Display::create(['name' => 'Billboard 1', 'x' => 60.75, 'y' => 24.22, 'width' => 10.94, 'height' => 32.81]);
        // Manual adjustment for Billboard 2 (User feedback: too big width, but needs more height)
        Display::create(['name' => 'Billboard 2', 'x' => 37.50, 'y' => 41.00, 'width' => 3.50, 'height' => 12.30]);

        // 2. Create Ads
        $adCoke = Ad::create([
            'name' => 'Coca Cola Summer',
            'type' => 'image',
            'content_path' => 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&q=80&w=800',
            'duration' => 10
        ]);

        $adNike = Ad::create([
            'name' => 'Nike Air Max',
            'type' => 'image',
            'content_path' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
            'duration' => 10
        ]);

        $adBakery = Ad::create([
            'name' => 'Morning Croissant',
            'type' => 'text',
            'content_path' => 'Fresh Croissants 50% Off! Valid until 10AM.',
            'duration' => 10
        ]);

        $adTech = Ad::create([
            'name' => 'Tech Conference',
            'type' => 'text',
            'content_path' => 'DevConf 2025 - Register Now',
            'duration' => 10
        ]);

        // 3. Create TimeZones
        $tzMorning = TimeZone::create([
            'name' => 'Morning Rush',
            'start_time' => '07:00:00',
            'end_time' => '10:00:00',
            'multiplier' => 1.5
        ]);

        $tzStandard = TimeZone::create([
            'name' => 'Standard Day',
            'start_time' => '10:00:00',
            'end_time' => '17:00:00',
            'multiplier' => 1.0
        ]);

        $tzEvening = TimeZone::create([
            'name' => 'Evening Prime',
            'start_time' => '17:00:00',
            'end_time' => '22:00:00',
            'multiplier' => 2.0
        ]);

        // 4. Create Campaigns
        // Coke: All TimeZones (Morning, Standard, Evening)
        $campCoke = Campaign::create([
            'ad_id' => $adCoke->id,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'appearances_total' => 1000
        ]);
        $campCoke->timeZones()->attach([$tzMorning->id, $tzStandard->id, $tzEvening->id]);

        // Nike: Evening Only
        $campNike = Campaign::create([
            'ad_id' => $adNike->id,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'appearances_total' => 500
        ]);
        $campNike->timeZones()->attach($tzEvening->id);

        // Bakery: Morning Only
        $campBakery = Campaign::create([
            'ad_id' => $adBakery->id,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'appearances_total' => 300
        ]);
        $campBakery->timeZones()->attach($tzMorning->id);

        // Tech: Standard Day
        $campTech = Campaign::create([
            'ad_id' => $adTech->id,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'appearances_total' => 500
        ]);
        $campTech->timeZones()->attach($tzStandard->id);
    }
}
