import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DICT_DIR = join(__dirname, '..', 'src', 'lib', 'i18n', 'dictionaries');

const SUPPORTED_PLATFORMS_MODAL = {
  en: {
    title: "Supported Media Platforms",
    badge: "25+ Live",
    description: "VoidFetch supports high-speed video, audio, image, and HLS/M3U8 extraction across global sites.",
    searchPlaceholder: "Search platform (e.g. YouTube, Douyin, TikTok, Pinterest, SoundCloud...)",
    noSearchResults: "No platform found matching \"{query}\"",
    activeStreamer: "Active Streamer",
    active: "Active",
    fastExtract: "Fast Extract",
    autoDetect: "Auto Detect",
    showingCount: "Showing {count} of {total} Supported Platforms",
    close: "Close",
    clickDetails: "Click to view details",
    clickTitle: "Click to view all 25+ supported platforms",
    universalSub: "Universal Batch Downloader"
  },
  vi: {
    title: "Nền tảng truyền thông được hỗ trợ",
    badge: "25+ Đang hoạt động",
    description: "VoidFetch hỗ trợ trích xuất video, âm thanh, hình ảnh và luồng HLS/M3U8 tốc độ cao trên các trang web toàn cầu.",
    searchPlaceholder: "Tìm kiếm nền tảng (ví dụ: YouTube, Douyin, TikTok, Pinterest, SoundCloud...)",
    noSearchResults: "Không tìm thấy nền tảng phù hợp với \"{query}\"",
    activeStreamer: "Máy chủ hoạt động",
    active: "Hoạt động",
    fastExtract: "Trích xuất nhanh",
    autoDetect: "Tự động nhận diện",
    showingCount: "Hiển thị {count} trên {total} nền tảng được hỗ trợ",
    close: "Đóng",
    clickDetails: "Nhấp để xem chi tiết",
    clickTitle: "Nhấp để xem tất cả hơn 25 nền tảng được hỗ trợ",
    universalSub: "Trình tải hàng loạt đa năng"
  },
  es: {
    title: "Plataformas de medios compatibles",
    badge: "25+ Activas",
    description: "VoidFetch admite la extracción de video, audio, imágenes y transmisiones HLS/M3U8 a alta velocidad.",
    searchPlaceholder: "Buscar plataforma (ej. YouTube, Douyin, TikTok, Pinterest, SoundCloud...)",
    noSearchResults: "No se encontraron plataformas que coincidan con \"{query}\"",
    activeStreamer: "Servidor activo",
    active: "Activo",
    fastExtract: "Extracción rápida",
    autoDetect: "Detección automática",
    showingCount: "Mostrando {count} de {total} plataformas compatibles",
    close: "Cerrar",
    clickDetails: "Haz clic para ver detalles",
    clickTitle: "Haz clic para ver las 25+ plataformas compatibles",
    universalSub: "Descargador masivo universal"
  },
  ja: {
    title: "対応メディアプラットフォーム",
    badge: "25+ 稼働中",
    description: "VoidFetchは、動画、音声、画像、HLS/M3U8ストリームの高速抽出に対応しています。",
    searchPlaceholder: "プラットフォームを検索 (例: YouTube, Douyin, TikTok, Pinterest, SoundCloud...)",
    noSearchResults: "「{query}」に一致するプラットフォームが見つかりません",
    activeStreamer: "アクティブ配信",
    active: "稼働中",
    fastExtract: "高速抽出",
    autoDetect: "自動判別",
    showingCount: "{total} 件中 {count} 件の対応プラットフォームを表示",
    close: "閉じる",
    clickDetails: "クリックして詳細を表示",
    clickTitle: "クリックして対応する全25以上のプラットフォームを表示",
    universalSub: "万能一括ダウンローダー"
  },
  ru: {
    title: "Поддерживаемые медиа-платформы",
    badge: "25+ Активно",
    description: "VoidFetch поддерживает высокоскоростное извлечение видео, аудио, изображений и HLS/M3U8 потоков.",
    searchPlaceholder: "Поиск платформы (например, YouTube, Douyin, TikTok, Pinterest, SoundCloud...)",
    noSearchResults: "Платформы по запросу «{query}» не найдены",
    activeStreamer: "Активный сервер",
    active: "Активно",
    fastExtract: "Быстрое извлечение",
    autoDetect: "Автоопределение",
    showingCount: "Отображение {count} из {total} поддерживаемых платформ",
    close: "Закрыть",
    clickDetails: "Нажмите для подробностей",
    clickTitle: "Нажмите, чтобы просмотреть все 25+ поддерживаемых платформ",
    universalSub: "Универсальный пакетный загрузчик"
  },
  zh: {
    title: "支持的媒体平台",
    badge: "25+ 在线",
    description: "VoidFetch 支持全球主流平台的视频、音频、图集及 HLS/M3U8 高速解析下载。",
    searchPlaceholder: "搜索平台 (例如 YouTube, Douyin, TikTok, Pinterest, SoundCloud...)",
    noSearchResults: "未找到匹配 \"{query}\" 的平台",
    activeStreamer: "在线解析中",
    active: "在线",
    fastExtract: "极速提取",
    autoDetect: "自动识别",
    showingCount: "显示 {total} 个支持平台中的 {count} 个",
    close: "关闭",
    clickDetails: "点击查看详情",
    clickTitle: "点击查看全部 25+ 支持的平台",
    universalSub: "全能批量下载工具"
  },
  "zh-tw": {
    title: "支援的媒體平台",
    badge: "25+ 線上",
    description: "VoidFetch 支援全球主流平台的影片、音訊、圖集及 HLS/M3U8 高速解析下載。",
    searchPlaceholder: "搜尋平台 (例如 YouTube, Douyin, TikTok, Pinterest, SoundCloud...)",
    noSearchResults: "未找到符合 \"{query}\" 的平台",
    activeStreamer: "線上解析中",
    active: "線上",
    fastExtract: "極速提取",
    autoDetect: "自動識別",
    showingCount: "顯示 {total} 個支援平台中的 {count} 個",
    close: "關閉",
    clickDetails: "點擊查看詳情",
    clickTitle: "點擊查看全部 25+ 支援的平台",
    universalSub: "全能批量下載工具"
  }
};

const JAPANESE_ABOUT_PAGE = {
  metaTitle: "VoidFetchについて | VoidFetch",
  metaDescription: "VoidFetchの詳細、VoidStation製品仕様、著作権情報、プライバシーポリシー、利用規約について。",
  title: "VoidFetchについて",
  subtitle: "VoidStation製品情報",
  productInfo: "製品情報",
  productName: "製品名",
  publisher: "発行元",
  appVersion: "アプリケーションバージョン",
  targetRuntime: "ターゲットランタイム",
  compilationBuild: "ビルド構成",
  thirdPartyLibraries: "サードパーティライブラリと感謝",
  thirdPartyDesc: "VoidFetchは、Next.js、React 19、Tailwind CSS、Radix UI、Zustand、IndexedDB、FFmpeg.wasm (GPL/LGPL v3+)、JSZip、browser-fs-access などのオープンソースプロジェクトに支えられています。",
  copyrightNotice: "著作権情報",
  copyrightTitle: "VoidFetch © 2026 VoidStation.",
  copyrightSub: "All rights reserved.",
  copyrightDesc: "メディアコンテンツ（動画、音声、画像）の権利は、各プラットフォームの所有者およびコンテンツ制作者に帰属します。",
  privacyPolicy: "プライバシーポリシー",
  privacyDesc: "VoidFetchはユーザーのプライバシーを最優先しています。すべてのダウンロード、復号化、バッファ作成処理はブラウザのサンドボックス内で完結し、サーバー上に保存されません。",
  responsibleUse: "利用規範ポリシー",
  responsibleUseDesc: "VoidFetchは公開メディアのアーカイブ用ツールです。ユーザーは入力するコンテンツのダウンロード権限を所有している必要があります。"
};

function copyStructure(canonical, target, locale) {
  if (canonical === null || typeof canonical !== 'object') {
    return target !== undefined ? target : canonical;
  }
  if (Array.isArray(canonical)) {
    const targetArr = Array.isArray(target) ? target : [];
    return canonical.map((item, i) => copyStructure(item, targetArr[i], locale));
  }
  const result = {};
  for (const key of Object.keys(canonical)) {
    if (target && key in target) {
      result[key] = copyStructure(canonical[key], target[key], locale);
    } else {
      // Fallback logic for missing blocks
      if (key === 'supportedPlatformsModal') {
        result[key] = SUPPORTED_PLATFORMS_MODAL[locale] || SUPPORTED_PLATFORMS_MODAL.en;
      } else if (key === 'aboutPage' && locale === 'ja') {
        result[key] = JAPANESE_ABOUT_PAGE;
      } else {
        result[key] = copyStructure(canonical[key], undefined, locale);
      }
    }
  }
  return result;
}

async function main() {
  const files = await readdir(DICT_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  // Load canonical en.json
  const enRaw = await readFile(join(DICT_DIR, 'en.json'), 'utf8');
  let en = JSON.parse(enRaw);
  en.supportedPlatformsModal = SUPPORTED_PLATFORMS_MODAL.en;
  await writeFile(join(DICT_DIR, 'en.json'), JSON.stringify(en, null, 4) + '\n', 'utf8');

  for (const file of jsonFiles) {
    if (file === 'en.json') continue;
    const locale = file.replace('.json', '');
    const raw = await readFile(join(DICT_DIR, file), 'utf8');
    const dict = JSON.parse(raw);

    dict.supportedPlatformsModal = SUPPORTED_PLATFORMS_MODAL[locale] || SUPPORTED_PLATFORMS_MODAL.en;
    if (locale === 'ja' && !dict.aboutPage) {
      dict.aboutPage = JAPANESE_ABOUT_PAGE;
    }

    const synced = copyStructure(en, dict, locale);
    await writeFile(join(DICT_DIR, file), JSON.stringify(synced, null, 4) + '\n', 'utf8');
    console.log(`Synced dictionary for locale: ${locale}`);
  }
}

main().catch(console.error);
