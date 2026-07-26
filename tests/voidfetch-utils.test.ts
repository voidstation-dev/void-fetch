/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import { describe, expect, it } from 'vitest';
import { extractAndNormalizeUrls, normalizeUrl, detectPlatform } from '../src/features/batch-download/utils/normalize-url';
import { renderFilename } from '../src/features/batch-download/utils/filename-template';
import { calculateSegmentConcurrency } from '../src/features/batch-download/utils/concurrency-budget';

describe('URL Normalizer & Platform Detector', () => {
  it('detects correct platforms from domains', () => {
    expect(detectPlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube');
    expect(detectPlatform('https://www.bilibili.com/video/BV1GJ411x7h7')).toBe('bilibili');
    expect(detectPlatform('https://v.douyin.com/abc')).toBe('douyin');
    expect(detectPlatform('https://www.tiktok.com/@creator/video/123')).toBe('tiktok');
    expect(detectPlatform('https://www.xiaohongshu.com/discovery/item/123')).toBe('xiaohongshu');
    expect(detectPlatform('https://example.com')).toBe('generic');
  });

  it('removes tracking parameters during URL normalization', () => {
    const raw = 'https://www.bilibili.com/video/BV1GJ411x7h7?spm_id_from=333.1007&vd_source=123';
    expect(normalizeUrl(raw)).toBe('https://www.bilibili.com/video/BV1GJ411x7h7');
    
    const utm = 'https://youtube.com/watch?v=123&utm_source=twitter&utm_medium=social';
    expect(normalizeUrl(utm)).toBe('https://youtube.com/watch?v=123');
  });

  it('extracts and processes multiple URLs from text', () => {
    const text = `
      Check this out: https://www.youtube.com/watch?v=123&utm_source=test
      Also this: https://www.tiktok.com/@creator/video/abc
      And a duplicate: https://www.youtube.com/watch?v=123&utm_source=test
    `;

    const extracted = extractAndNormalizeUrls(text);
    expect(extracted.length).toBe(3);
    expect(extracted[0].platform).toBe('youtube');
    expect(extracted[0].status).toBe('valid');
    expect(extracted[0].normalized).toBe('https://www.youtube.com/watch?v=123');
    
    expect(extracted[2].status).toBe('duplicate');
  });
});

describe('Filename Template Rendering', () => {
  it('replaces placeholder tokens correctly', () => {
    const template = '{index} - {platform}_{mediaId} - {title}';
    const variables = {
      index: 5,
      title: 'Cool Video / Stream',
      platform: 'bilibili',
      mediaId: 'BV1GJ411x7h7',
      quality: '1080p',
    };

    const rendered = renderFilename(template, variables, 'mp4');
    // Title has a slash which should be sanitized out to a hyphen
    expect(rendered).toBe('005 - bilibili_BV1GJ411x7h7 - Cool Video - Stream.mp4');
  });
});

describe('Segment Concurrency Budget', () => {
  it('calculates dynamic segments concurrency based on budget', () => {
    // Budget is 18
    expect(calculateSegmentConcurrency(1)).toBe(18);
    expect(calculateSegmentConcurrency(2)).toBe(9);
    expect(calculateSegmentConcurrency(3)).toBe(6);
    expect(calculateSegmentConcurrency(5)).toBe(3);
    // Should never drop below 2
    expect(calculateSegmentConcurrency(12)).toBe(2);
  });
});
