# VoidFetch — Universal Batch Media Downloader Workspace

[![React 19](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-App_Router-black.svg)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production_Ready-brightgreen.svg)]()

**VoidFetch** is a state-of-the-art, high-performance web-based batch media downloader workspace built with **Next.js**, **React 19**, and **Vite**. It enables seamless multi-threaded metadata parsing, stream resolution, and concurrent batch downloading across **25+ major social media and streaming platforms**.

> 🌐 **Public API Architecture**: VoidFetch connects directly to the high-availability Public Parsing API service (`https://downloader-api.bhwa233.com`) for real-time link normalization, metadata extraction, and stream url resolution. All actual segment downloads, buffer assembly, decryption, and file saving occur 100% client-side inside your browser sandbox.

---

## ✨ Features & Architecture Highlights

- ⚡ **Zero-Flash SSR & Instant Hydration**: Architected with top-level Next.js Server Components (RSC) and `useSyncExternalStore` guards to ensure instant, static HTML paint on frame 0 with 0ms layout shift or page reload flash.
- 🚀 **Multi-Threaded Worker Pool**: Concurrent URL parsing worker queue with exponential backoff retry and configurable network budgets.
- 🎬 **25+ Supported Platforms**: Full support for YouTube, TikTok, Bilibili, Douyin, Instagram Reels, Pinterest, Threads, Reddit, SoundCloud, Apple Podcasts, X (Twitter), Vimeo, Dailymotion, and more.
- 🎨 **Glassmorphism Aesthetic**: Modern, dark-mode first UI built with Tailwind CSS, Aceternity UI effects, spotlight cards, and responsive ambient layouts.
- 🔐 **Privacy-First Sandboxing**: Media content streams directly from platform CDNs into browser memory/IndexedDB — downloaded video and audio files never touch or cache on VoidStation servers.
- 🎧 **Client-Side Media Transcoding**: Embedded FFmpeg.wasm for browser-side MP3 audio extraction and JSZip for multi-photo gallery archiving.

---

## 🌐 Public API & Environment Configuration

VoidFetch communicates with public endpoints for media metadata parsing:

| Environment Variable | Description | Default Value |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Public Parsing API Base Endpoint | `https://downloader-api.bhwa233.com` |
| `NEXT_PUBLIC_SITE_URL` | Application Public URL | `http://localhost:3010` |
| `SEO_INDEXABLE` | Search Engine Indexing Switch | `true` |

### API Endpoints Overview
- **Parse Endpoint**: `GET https://downloader-api.bhwa233.com/api/parse?url={media_url}`
- **Download Proxy**: `GET https://downloader-api.bhwa233.com/api/download?url={stream_url}`
- **HLS Proxy**: `/api/hls-download-proxy` & `/api/hls-play-proxy`

---

## 🛠️ Supported Platforms

| Platform | Supported Media Formats | Special Features |
|---|---|---|
| **YouTube** | MP4 Video (Up to 4K/60FPS), MP3 Audio | Shorts & Video Links |
| **TikTok** | No-Watermark MP4, MP3 Audio | Global & Regional TikTok |
| **Bilibili** | MP4 Video, MP3 Audio | BV & AV links, B23 short URLs |
| **Douyin (抖音)** | HD Video, Photo Posts, MP3 Audio | No-watermark extraction |
| **Instagram** | Reels, Posts, Carousel Photos | Multi-photo ZIP support |
| **Pinterest** | Original HD Pins, Photo Collections | Photo & Video Pin extraction |
| **Threads** | Post Videos, Images | Multi-image archiving |
| **Apple Podcasts** | MP3 / AAC Episodes, Show Feeds | Episode picker & browser player |
| **SoundCloud** | HQ Audio Tracks | Cover artwork extraction |
| **X / Twitter** | MP4 Video, GIFs | High-bitrate video streams |
| **Vimeo & Dailymotion** | HD MP4 Video Streams | Direct stream extraction |
| **Reddit & Tumblr** | Embedded Video, Photo Posts | Post media extraction |
| **HLS / M3U8** | Live & Vod Streams | Browser segment stitching |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `>= 18.0.0`
- **Package Manager**: `pnpm` (recommended) or `npm` / `yarn`

### Installation & Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/voidstation-dev/void-fetch.git
   cd void-fetch
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Start the local development server**:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3010](http://localhost:3010) in your browser.

4. **Build for Production**:
   ```bash
   pnpm build
   ```

5. **Run Production Server**:
   ```bash
   pnpm start
   ```

---

## 📁 Repository Structure

```text
src/
├── app/                  # Next.js App Router localized routes ([locale])
│   ├── [locale]/         # I18n routes (/, /about, /history, /settings, /privacy)
│   └── api/              # HLS proxy & CORS image streaming endpoints
├── components/           # Reusable UI & Layout components
│   ├── downloader/       # Platform marquee & supported platform cards
│   ├── layout/           # App top bar & navigation
│   └── ui/               # Glassmorphic primitives (SpotlightCard, EncryptedText)
├── features/             # Feature-driven modular architecture
│   └── batch-download/   # Batch workspace, queue manager, worker pool & store
├── i18n/                 # Internationalization client & server providers
└── lib/                  # Unified parser, API error handler & utility functions
```

---

## 🤝 Contributing

We welcome community contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on bug reporting, feature requests, code style, and submitting pull requests.

---

## ⚖️ License & Responsible Use

Distributed under the **MIT License**.

> ⚠️ **Notice**: VoidFetch is designed for archiving public media for personal use. VoidFetch does not circumvent Digital Rights Management (DRM) or download paid/member-only restricted content. Please respect original creators and platform copyright terms.

Copyright © 2026 **VoidStation**. All rights reserved.
