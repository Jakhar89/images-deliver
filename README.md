# 🖼️ ImageCDN Hub

> A premium image hosting repository powered by **jsDelivr** CDN. Host your images on GitHub, then serve them globally with zero cost or configuration.

[![jsDelivr CDN](https://data.jsdelivr.com/v1/package/gh/your-username/images-deliver/badge)](https://www.jsdelivr.com/package/gh/your-username/images-deliver)

---

## 📦 How It Works

When you push images to this repository, **jsDelivr** automatically makes them available through their global CDN (750+ PoPs worldwide) using this URL pattern:

```
https://cdn.jsdelivr.net/gh/<username>/<repo>@<branch>/<path>
```

**Example:**
```
https://cdn.jsdelivr.net/gh/your-username/images-deliver@main/images/hero-cyberpunk.png
```

---

## 🗂 Repository Structure

```
images-deliver/
├── images/
│   ├── hero-cyberpunk.png      # Cyberpunk city hero background
│   ├── abstract-glass.png      # Glassmorphism abstract art
│   ├── workspace-minimal.png   # Minimal workspace setup
│   ├── avatar-robot.png        # AI robot avatar
│   └── space-nebula.png        # Cosmic nebula galaxy background
├── index.html                  # Interactive CDN Hub Dashboard
├── styles.css                  # Premium dark-mode stylesheet
├── app.js                      # Dashboard application logic
└── README.md                   # This file
```

---

## 🚀 Quick Start

### 1. Fork / Clone this Repository
```bash
git clone https://github.com/your-username/images-deliver.git
cd images-deliver
```

### 2. Add Your Images
```bash
# Copy your image files into the images/ directory
cp ~/Desktop/my-photo.png images/
```

### 3. Commit & Push
```bash
git add images/my-photo.png
git commit -m "add: my-photo"
git push origin main
```

### 4. Use the CDN URL in your project!
```
https://cdn.jsdelivr.net/gh/your-username/images-deliver@main/images/my-photo.png
```

---

## 🌐 Usage Examples

### HTML `<img>`
```html
<img
  src="https://cdn.jsdelivr.net/gh/your-username/images-deliver@main/images/hero-cyberpunk.png"
  alt="Cyberpunk Hero"
  loading="lazy"
  width="1024"
  height="1024"
/>
```

### CSS `background-image`
```css
.hero-section {
  background-image: url("https://cdn.jsdelivr.net/gh/your-username/images-deliver@main/images/space-nebula.png");
  background-size: cover;
  background-position: center;
}
```

### React / JSX
```jsx
const CDN_BASE = "https://cdn.jsdelivr.net/gh/your-username/images-deliver@main";

export default function HeroImage() {
  return (
    <img
      src={`${CDN_BASE}/images/hero-cyberpunk.png`}
      alt="Cyberpunk Hero"
      loading="lazy"
    />
  );
}
```

### Next.js `<Image>`
```jsx
import Image from 'next/image';

export default function Hero() {
  return (
    <Image
      src="https://cdn.jsdelivr.net/gh/your-username/images-deliver@main/images/hero-cyberpunk.png"
      alt="Hero"
      width={1024}
      height={1024}
      priority
    />
  );
}
```

### Markdown
```markdown
![Hero Image](https://cdn.jsdelivr.net/gh/your-username/images-deliver@main/images/hero-cyberpunk.png)
```

---

## ⚡ Alternative CDN Platforms

| Platform | Base URL | Notes |
|---|---|---|
| **jsDelivr** | `https://cdn.jsdelivr.net/gh/:user/:repo@:branch/` | ✅ Recommended — best caching |
| **Statically** | `https://cdn.statically.io/gh/:user/:repo/:branch/` | Good fallback |
| **GitHub Pages** | `https://:user.github.io/:repo/` | Requires GH Pages enabled |
| **Raw GitHub** | `https://raw.githubusercontent.com/:user/:repo/:branch/` | ⚠️ No CDN — slow |

---

## 🏷️ Versioning for Cache Busting

For production, tag your releases and use version tags instead of `@main`:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Then use:
```
https://cdn.jsdelivr.net/gh/your-username/images-deliver@1.0.0/images/hero-cyberpunk.png
```

This ensures your URLs never break even if you update images.

---

## 📊 Dashboard

Open `index.html` in your browser to access the interactive CDN Hub dashboard:
- 🎛️ Configure your GitHub username, repo, and branch
- 🖼️ Browse and preview all hosted images
- 📋 Generate ready-to-paste code snippets for HTML, CSS, React, Next.js, and Markdown
- 🔗 One-click copy CDN URLs
- 🔎 Search and filter by image type

---

## 📜 License

MIT © your-username — Free to use, modify, and distribute.
