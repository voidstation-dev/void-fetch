# Contributing to VoidFetch

First off, thank you for considering contributing to **VoidFetch**! 🎉

VoidFetch is an open-source, high-performance batch media downloader workspace built with Next.js, React 19, Vite, and Tailwind CSS. We welcome contributions from developers of all skill levels.

---

## 📜 Code of Conduct

By participating in this project, you agree to maintain a respectful, inclusive, and collaborative environment. Please treat all contributors with respect and professionalism.

---

## 🚀 How to Contribute

### 1. Reporting Bugs

If you encounter a bug, broken platform parser, or UI issue:

- Search existing [GitHub Issues](https://github.com/voidstation-dev/void-fetch/issues) to ensure it hasn't been reported yet.
- Open a new issue with a clear title, reproduction steps, expected vs. actual behavior, browser version, and OS details.

### 2. Suggesting Enhancements & New Platforms

We welcome feature requests and new platform parsing additions:

- Open a feature request issue describing the proposed functionality and benefits.
- Provide example public links or platform documentation if requesting a new platform media extractor.

### 3. Submitting Pull Requests (PRs)

1. **Clone or Fork the Repository**:
   ```bash
   git clone https://github.com/voidstation-dev/void-fetch.git
   cd void-fetch
   ```
2. **Checkout the `dev` branch and pull latest changes**:
   ```bash
   git checkout dev
   git pull origin dev
   ```
3. **Create a Feature/Bugfix Branch from `dev`**:
   ```bash
   git checkout -b feat/your-feature-name
   ```
4. **Install Dependencies & Start Development Server**:
   ```bash
   pnpm install
   pnpm dev
   ```
5. **Make your changes**: Follow existing code style, ensure zero-flash SSR hydration, and maintain high contrast design guidelines.
6. **Run Verification Commands**:
   ```bash
   npx tsc --noEmit
   pnpm lint
   pnpm test
   ```
7. **Commit using Conventional Commits**:
   - `feat: add new platform extractor for Vimeo`
   - `fix: resolve hydration warning on batch composer`
   - `docs: update setup instructions`
   - `style: refine failed status badge contrast`
8. **Push to your feature branch and open a Pull Request**: Submit your PR targeting `dev` for review before merging into `main`.

---

## 🛠️ Local Development Guide

- **Framework**: Next.js 16 App Router (RSC) + Vite 8
- **UI & Styling**: Tailwind CSS, Lucide Icons, Glassmorphism design tokens
- **State Management**: Zustand with IndexedDB persistence
- **Transcoding**: Browser-side FFmpeg.wasm & JSZip

### Environment Variables

We use `.env.example` as a template for environment variables. To run the project locally, copy this file to `.env.local`:

```bash
cp .env.example .env.local
```

You can then configure `.env.local` with your custom backend endpoints or other settings as needed:

```env
NEXT_PUBLIC_API_BASE_URL=https://downloader-api.bhwa233.com
NEXT_PUBLIC_SITE_URL=http://localhost:3010
SEO_INDEXABLE=true
```

---

## ⚖️ License

By contributing code to VoidFetch, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
