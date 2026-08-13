import os
from PIL import Image

def create_android_icons():
    # Source image path
    src_path = os.path.abspath('client/app/favicon.ico')
    
    if not os.path.exists(src_path):
        print(f"Error: Source image not found at {src_path}")
        return

    # Open image
    img = Image.open(src_path)
    img = img.convert('RGBA')

    # Densities and sizes (width, height)
    standard_sizes = {
        'mipmap-mdpi': (48, 48),
        'mipmap-hdpi': (72, 72),
        'mipmap-xhdpi': (96, 96),
        'mipmap-xxhdpi': (144, 144),
        'mipmap-xxxhdpi': (192, 192)
    }

    foreground_sizes = {
        'mipmap-mdpi': (108, 108),
        'mipmap-hdpi': (162, 162),
        'mipmap-xhdpi': (216, 216),
        'mipmap-xxhdpi': (324, 324),
        'mipmap-xxxhdpi': (432, 432)
    }

    # Res destinations
    res_dirs = [
        os.path.abspath('android/app/src/main/res'),
        os.path.abspath('client/android/app/src/main/res')
    ]

    for res_dir in res_dirs:
        if not os.path.exists(res_dir):
            continue
        
        print(f"Generating icons for: {res_dir}")

        for density, size in standard_sizes.items():
            density_dir = os.path.join(res_dir, density)
            os.makedirs(density_dir, exist_ok=True)

            # 1. Standard ic_launcher.png
            resized = img.resize(size, Image.LANCZOS)
            resized.save(os.path.join(density_dir, 'ic_launcher.png'), 'PNG')

            # 2. Round ic_launcher_round.png
            # Create a circular mask if desired, or save high quality PNG
            resized.save(os.path.join(density_dir, 'ic_launcher_round.png'), 'PNG')

        for density, size in foreground_sizes.items():
            density_dir = os.path.join(res_dir, density)
            os.makedirs(density_dir, exist_ok=True)

            # 3. Adaptive ic_launcher_foreground.png
            # Android adaptive foreground is 108dp with a 66dp safe zone in center (~61% scale)
            fg_canvas = Image.new('RGBA', size, (0, 0, 0, 0))
            inner_w = int(size[0] * 0.65)
            inner_h = int(size[1] * 0.65)
            inner_img = img.resize((inner_w, inner_h), Image.LANCZOS)
            
            offset_x = (size[0] - inner_w) // 2
            offset_y = (size[1] - inner_h) // 2
            fg_canvas.paste(inner_img, (offset_x, offset_y), inner_img)
            
            fg_canvas.save(os.path.join(density_dir, 'ic_launcher_foreground.png'), 'PNG')

    print("✅ All Android app icons generated successfully!")

if __name__ == '__main__':
    create_android_icons()
