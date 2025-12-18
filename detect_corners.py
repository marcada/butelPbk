from PIL import Image, ImageDraw
import sys
import colorsys
import json

def find_corners(image_path):
    try:
        img = Image.open(image_path)
        img = img.convert("RGB")
        width, height = img.size
        pixels = img.load()
        
        # Binary mask for green
        mask = Image.new('L', (width, height), 0)
        mask_pixels = mask.load()
        
        has_green = False
        for y in range(height):
            for x in range(width):
                r, g, b = pixels[x, y]
                h, s, v = colorsys.rgb_to_hsv(r/255.0, g/255.0, b/255.0)
                
                # Sligthly relaxed HSV
                if 0.22 <= h <= 0.45 and s > 0.25 and v > 0.2:
                    mask_pixels[x, y] = 255
                    has_green = True
                    
        if not has_green:
            print("No green found")
            return

        # Simple approach to find corners of connected components
        # We will find connected components (clusters) again
        visited = set()
        clusters = []
        
        for y in range(height):
            for x in range(width):
                if mask_pixels[x, y] == 255 and (x, y) not in visited:
                    # Flood fill
                    stack = [(x, y)]
                    visited.add((x, y))
                    cluster_pixels = []
                    
                    while stack:
                        cx, cy = stack.pop()
                        cluster_pixels.append((cx, cy))
                        
                        for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
                            nx, ny = cx + dx, cy + dy
                            if 0 <= nx < width and 0 <= ny < height:
                                if mask_pixels[nx, ny] == 255 and (nx, ny) not in visited:
                                    visited.add((nx, ny))
                                    stack.append((nx, ny))
                    
                    if len(cluster_pixels) > 100: # Filter noise
                        clusters.append(cluster_pixels)

        # Sort clusters by x (left to right)
        clusters.sort(key=lambda c: min(p[0] for p in c))
        
        results = []
        for i, cluster in enumerate(clusters[:2]): # Top 2
            # Find extreme points
            # Top-Left: min(x+y) ? No.
            # Convex Hull is best, but let's approximate 4 corners.
            # 1. Top-most pixel (min y)
            # 2. Bottom-most pixel (max y)
            # 3. Left-most (min x)
            # 4. Right-most (max x)
            # This works for "diamond" shapes but not aligned rectangles.
            
            # Better: Sum of coords.
            # TL: min(x+y)
            # TR: max(x-y) (maximize x, minimize y) -> x-y
            # BL: min(x-y) (minimize x, maximize y) -> x-y
            # BR: max(x+y)
            
            tl = min(cluster, key=lambda p: p[0] + p[1])
            tr = max(cluster, key=lambda p: p[0] - p[1])
            bl = min(cluster, key=lambda p: p[0] - p[1])
            br = max(cluster, key=lambda p: p[0] + p[1])
            
            # Convert to percentages
            def to_pct(p):
                return {"x": round(p[0]/width*100, 2), "y": round(p[1]/height*100, 2)}

            results.append({
                "name": f"Billboard {i+1}",
                "corners": [to_pct(tl), to_pct(tr), to_pct(br), to_pct(bl)], # CSS polygon order
                "bounds": {
                    "min_x": min(p[0] for p in cluster),
                    "max_x": max(p[0] for p in cluster),
                    "min_y": min(p[1] for p in cluster),
                    "max_y": max(p[1] for p in cluster),
                }
            })
            
        print(json.dumps(results, indent=2))

    except Exception as e:
        print(e)

if __name__ == "__main__":
    find_corners("api/public/slikata.png")
