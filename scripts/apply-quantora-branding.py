from pathlib import Path
from PIL import Image, ImageOps

root = Path('/home/ubuntu/quantora-upload-audit/source')
source = root / 'apps/mobile/android/app/src/main/assets/public/quantora-logo.png'
logo = Image.open(source).convert('RGB')

# Web/PWA assets.
web_assets = {
    'apps/mobile/android/app/src/main/assets/public/icons/icon-192.png': (192, 192),
    'apps/mobile/android/app/src/main/assets/public/icons/icon-512.png': (512, 512),
    'apps/mobile/android/app/src/main/assets/public/icons/apple-touch-icon.png': (180, 180),
    'apps/mobile/android/app/src/main/assets/public/logo.png': (1024, 1024),
    'apps/mobile/android/app/src/main/assets/public/nexora-logo.png': (1024, 1024),
}
for relative, size in web_assets.items():
    target = root / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    logo.resize(size, Image.Resampling.LANCZOS).save(target, format='PNG', optimize=True)

# Android launcher assets. Preserve the existing density structure but use Quantora artwork.
launcher_sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}
for folder, size in launcher_sizes.items():
    directory = root / 'apps/mobile/android/app/src/main/res' / folder
    directory.mkdir(parents=True, exist_ok=True)
    icon = logo.resize((size, size), Image.Resampling.LANCZOS)
    for name in ('ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png'):
        icon.save(directory / name, format='PNG', optimize=True)

# Capacitor splash density variants. Center-crop the square logo into each requested canvas.
splash_sizes = {
    'drawable/splash.png': (1024, 1024),
    'drawable-port-mdpi/splash.png': (320, 480),
    'drawable-port-hdpi/splash.png': (480, 800),
    'drawable-port-xhdpi/splash.png': (720, 1280),
    'drawable-port-xxhdpi/splash.png': (960, 1600),
    'drawable-port-xxxhdpi/splash.png': (1280, 1920),
    'drawable-land-mdpi/splash.png': (480, 320),
    'drawable-land-hdpi/splash.png': (800, 480),
    'drawable-land-xhdpi/splash.png': (1280, 720),
    'drawable-land-xxhdpi/splash.png': (1600, 960),
    'drawable-land-xxxhdpi/splash.png': (1920, 1280),
}
for relative, size in splash_sizes.items():
    target = root / 'apps/mobile/android/app/src/main/res' / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    fitted = ImageOps.contain(logo, size, method=Image.Resampling.LANCZOS).convert('RGBA')
    canvas = Image.new('RGBA', size, '#050b14')
    canvas.alpha_composite(fitted, ((size[0] - fitted.width) // 2, (size[1] - fitted.height) // 2))
    canvas.save(target, format='PNG', optimize=True)

print('Applied Quantora branding to web, launcher, and splash assets.')
