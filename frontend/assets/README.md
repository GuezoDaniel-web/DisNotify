# assets/

Drop these three PNG files here — `manifest.webmanifest` and `sw.js` reference them by name:

| File | Size | Notes |
|---|---|---|
| `icon-192.png` | 192×192 | Home-screen / notification icon |
| `icon-512.png` | 512×512 | Splash screen |
| `icon-maskable-512.png` | 512×512 | Same art with ~20% safe padding on all sides (Android adaptive icons) |

Fastest way to generate them from one square source image:

```bash
npx pwa-asset-generator ./logo.png ./assets --icon-only --favicon
```

Until you add them the app still works — browsers just fall back to the inline SVG favicon
declared in each HTML file. Product images come from the backend (`product.image`), so nothing
else belongs in this folder.
