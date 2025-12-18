from PIL import Image
import json
import sys
import colorsys

def find_green_hotspots(image_path):
    try:
        img = Image.open(image_path)
        img = img.convert("RGB")
        width, height = img.size
        pixels = img.load()
        
        green_pixels = []
        
        for y in range(height):
            for x in range(width):
                r, g, b = pixels[x, y]
                
                # Convert to HSV
                h, s, v = colorsys.rgb_to_hsv(r/255.0, g/255.0, b/255.0)
                
                # Green Hue is around 120 degrees (0.33 in 0-1 scale)
                # Range: 0.25 to 0.45 (90 to 160 degrees) coverage for yellow-green to blue-green
                # Saturation: > 0.3 (avoid overly washed out)
                # Value: > 0.2 (avoid too dark)
                
                if 0.22 <= h <= 0.45 and s > 0.25 and v > 0.2:
                     green_pixels.append((x, y))
        
        if not green_pixels:
            print("No green pixels found.")
            return []

        # Simple clustering
        clusters = []
        visited = set()
        green_set = set(green_pixels)
        
        while green_set:
            start_x, start_y = next(iter(green_set))
            stack = [(start_x, start_y)]
            component = []
            
            # Use a slightly more aggressive flood fill or just bounding box combining?
            # Let's stick to component finding but we can merge close components later if needed.
            
            while stack:
                cx, cy = stack.pop()
                if (cx, cy) in green_set:
                    green_set.remove((cx, cy))
                    component.append((cx, cy))
                    
                    # 8-connectivity for better grasping of diagonal edges
                    for dx in [-1, 0, 1]:
                        for dy in [-1, 0, 1]:
                            if dx == 0 and dy == 0: continue
                            nx, ny = cx + dx, cy + dy
                            if (nx, ny) in green_set:
                                stack.append((nx, ny))
            
            clusters.append(component)
            
        results = []
        # Sort clusters by X position to keep order consistent
        clusters.sort(key=lambda c: min(p[0] for p in c))

        for i, cluster in enumerate(clusters):
            xs = [p[0] for p in cluster]
            ys = [p[1] for p in cluster]
            
            min_x, max_x = min(xs), max(xs)
            min_y, max_y = min(ys), max(ys)
            
            # Filter noise
            w_px = max_x - min_x
            h_px = max_y - min_y
            if w_px < 5 or h_px < 5:
                continue
                
            # Convert to percentages
            left_pct = (min_x / width) * 100
            top_pct = (min_y / height) * 100
            width_pct = ((w_px + 1) / width) * 100 # +1 to include the last pixel
            height_pct = ((h_px + 1) / height) * 100
            
            results.append({
                "area": w_px * h_px,
                "data": {
                    "name": "Billboard",
                    "x": round(left_pct, 2),
                    "y": round(top_pct, 2),
                    "width": round(width_pct, 2),
                    "height": round(height_pct, 2)
                }
            })
            
        # Sort by area descending
        results.sort(key=lambda x: x["area"], reverse=True)
        
        # Keep top 2 largest
        final_results = []
        for i, res in enumerate(results[:2]):
            res["data"]["name"] = f"Billboard {i+1}"
            final_results.append(res["data"])

        print(json.dumps(final_results, indent=2))
        return final_results

    except Exception as e:
        print(f"Error: {e}")
        return []

if __name__ == "__main__":
    image = "api/public/slikata.png"
    if len(sys.argv) > 1:
        image = sys.argv[1]
    find_green_hotspots(image)
