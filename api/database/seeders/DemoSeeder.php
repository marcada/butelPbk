<?php

namespace Database\Seeders;

use App\Models\Ad;
use App\Models\Campaign;
use App\Models\Display;
use App\Models\TimeZone;
use App\Models\Category;
use App\Models\Business;
use App\Models\Advertisement;
use App\Models\Post;
use App\Models\Event;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // Prevent duplicate records on container restarts/reseeds using direct SQL delete
        \Schema::disableForeignKeyConstraints();
        \DB::table('packages')->delete();
        \DB::table('displays')->delete();
        \DB::table('ads')->delete();
        \DB::table('time_zones')->delete();
        \DB::table('campaigns')->delete();
        \DB::table('categories')->delete();
        \DB::table('businesses')->delete();
        \DB::table('advertisements')->delete();
        \DB::table('posts')->delete();
        \DB::table('events')->delete();
        \DB::table('campaign_time_zone')->delete();
        
        // Reset SQLite auto-increment sequences if possible
        try {
            \DB::table('sqlite_sequence')->whereIn('name', [
                'packages', 'displays', 'ads', 'time_zones', 'campaigns', 
                'categories', 'businesses', 'advertisements', 'posts', 'events'
            ])->delete();
        } catch (\Exception $e) {
            // Ignore if sequences table is locked or unavailable
        }
        \Schema::enableForeignKeyConstraints();

        // 0. Create Packages
        $pkgBasic = \App\Models\Package::create([
            'name' => 'Basic',
            'displays_per_showing' => 50,
            'duration' => 20,
            'shows_per_day' => 20,
            'price' => 400,
            'color' => '#10b981' // emerald-500
        ]);

        $pkgPro = \App\Models\Package::create([
            'name' => 'Pro',
            'displays_per_showing' => 100,
            'duration' => 20,
            'shows_per_day' => 40,
            'price' => 700,
            'color' => '#f59e0b' // amber-500
        ]);

        $pkgEnterprise = \App\Models\Package::create([
            'name' => 'Enterprise',
            'displays_per_showing' => 200,
            'duration' => 20,
            'shows_per_day' => 80,
            'price' => 1200,
            'color' => '#6366f1' // indigo-500
        ]);

        // 1. Create Displays (Detected from slikata.png with HSV)
        Display::create(['name' => 'Billboard 1', 'x' => 60.75, 'y' => 24.22, 'width' => 10.94, 'height' => 32.81]);
        Display::create(['name' => 'Billboard 2', 'x' => 37.7, 'y' => 41.18, 'width' => 4.11, 'height' => 13.87]);

        // 2. Create Ads for Simulator
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

        // --- NEW SEEDING FOR PORTAL & DIRECTORY ---

        // 5. Create Categories
        $catFood = Category::create(['name' => 'Food', 'slug' => 'food']);
        $catCulture = Category::create(['name' => 'Culture', 'slug' => 'culture']);
        $catSpa = Category::create(['name' => 'Spa & Wellness', 'slug' => 'spa-wellness']);
        $catLandmarks = Category::create(['name' => 'Historical Landmarks', 'slug' => 'historical-landmarks']);

        // 6. Create Businesses
        $bizGino = Business::create([
            'name' => 'Restoran Gino',
            'categories' => ['Food'],
            'location' => 'Centar, Skopje',
            'latitude' => 41.9960,
            'longitude' => 21.4316,
            'package_id' => $pkgBasic->id,
            'image_path' => '/storage/covers/biz1.jpg',
            'contact_email' => 'gino@example.com',
            'contact_phone' => '070123456',
        ]);

        $bizSpa = Business::create([
            'name' => 'Spa Center Ohrid',
            'categories' => ['Spa & Wellness'],
            'location' => 'Ohrid',
            'latitude' => 41.1172,
            'longitude' => 20.8016,
            'package_id' => $pkgPro->id,
            'image_path' => '/storage/covers/biz2.jpg',
            'contact_email' => 'spa@example.com',
            'contact_phone' => '075987654',
        ]);

        // 7. Create Advertisements (Root Assets)
        Advertisement::create([
            'client_name' => 'Coca Cola',
            'title' => 'Coca Cola - Секогаш свежа енергија',
            'type_carousel' => true,
            'type_sidebar' => true,
            'type_billboard' => true,
            'carousel_image_path' => '/storage/content/coca_cola.jpg',
            'sidebar_image_path' => '/storage/content/coca_cola.jpg',
            'billboard_image_path' => '/storage/content/coca_cola.jpg',
            'business_id' => $bizGino->id
        ]);

        Advertisement::create([
            'client_name' => 'Кожувчанка',
            'title' => 'Кожувчанка - Природна изворска вода',
            'type_carousel' => true,
            'type_sidebar' => true,
            'type_billboard' => true,
            'carousel_image_path' => '/storage/content/kozuvcanka.jpg',
            'sidebar_image_path' => '/storage/content/kozuvcanka.jpg',
            'billboard_image_path' => '/storage/content/kozuvcanka.jpg',
            'business_id' => $bizSpa->id
        ]);

        Advertisement::create([
            'client_name' => 'Скопско',
            'title' => 'Скопско - Наше најдобро пиво',
            'type_carousel' => true,
            'type_sidebar' => true,
            'type_billboard' => true,
            'carousel_image_path' => '/storage/content/skopsko.jpg',
            'sidebar_image_path' => '/storage/content/skopsko.jpg',
            'billboard_image_path' => '/storage/content/skopsko.jpg',
            'business_id' => $bizGino->id
        ]);

        Advertisement::create([
            'client_name' => 'ВМРО',
            'title' => 'ВМРО-ДПМНЕ - Промени во живо',
            'type_carousel' => true,
            'type_sidebar' => true,
            'type_billboard' => true,
            'carousel_image_path' => '/storage/content/vmro.jpeg',
            'sidebar_image_path' => '/storage/content/vmro.jpeg',
            'billboard_image_path' => '/storage/content/vmro.jpeg',
            'business_id' => $bizSpa->id
        ]);

        // 8. Create Blog Posts
        Post::create([
            'category_id' => $catFood->id,
            'title' => '5 Најдобри италијански ресторани во Скопје',
            'slug' => '5-najdobri-italijanski-restorani-vo-skopje',
            'content' => 'Кога станува збор за италијанска храна, Скопје нуди навистина одлични места каде што можете да уживате во автентични вкусови на тестенини и пица. Нашата препорака за овој месец е дефинитивно Ресторан Гино во центарот на градот, кој нуди одлична атмосфера и вкусно мени.',
            'image_path' => 'posts/post1.png'
        ]);

        Post::create([
            'category_id' => $catCulture->id,
            'title' => 'Изложба на современа уметност во ГТЦ',
            'slug' => 'izlozba-na-sovremena-umetnost-vo-gtc',
            'content' => 'Изложбата ги прикажува најновите дела на нашите истакнати современи уметници. Настанот ќе биде отворен во текот на целиот викенд за сите љубители на уметноста и културните манифестации во градот.',
            'image_path' => 'posts/post1.png'
        ]);

        // 9. Create Events
        Event::create([
            'title' => 'Џез Фестивал Скопје',
            'description' => 'Годинашното издание на Џез Фестивалот Скопје ветува незаборавно музичко доживување со светски познати имиња од џез сцената.',
            'date' => '2026-06-15 20:00:00',
            'location' => 'Универзална Сала, Скопје',
            'image_path' => 'events/event1.png'
        ]);
    }
}
