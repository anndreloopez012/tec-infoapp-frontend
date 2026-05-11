import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobal } from '@/context/GlobalContext';
import { buildImageUrl } from '@/config/api.js';
import { buildSiteUrl, DEFAULT_SEO } from '@/config/seo';

interface SeoHeadProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  type?: string;
  keywords?: string[];
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  structuredData?: Record<string, any>[];
}

const MANAGED_STRUCTURED_DATA_SELECTOR = 'script[data-seo-managed="true"]';

const upsertMeta = (selector: string, attrs: Record<string, string>, content?: string) => {
  if (!content) return;

  let element = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement('meta');
    Object.entries(attrs).forEach(([key, value]) => element?.setAttribute(key, value));
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
};

const upsertLink = (selector: string, rel: string, href: string) => {
  let element = document.head.querySelector(selector) as HTMLLinkElement | null;

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);
};

const removeMeta = (selector: string) => {
  const element = document.head.querySelector(selector);
  if (element) {
    element.remove();
  }
};

const toAbsoluteImage = (image?: string | null) => {
  if (!image) return buildSiteUrl(DEFAULT_SEO.imagePath);
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith('/uploads/')) return buildImageUrl(image) || buildSiteUrl(DEFAULT_SEO.imagePath);
  return buildSiteUrl(image);
};

export const SeoHead = ({
  title,
  description,
  path,
  image,
  type = 'website',
  keywords = [],
  noindex = false,
  publishedTime,
  modifiedTime,
  structuredData = [],
}: SeoHeadProps) => {
  const location = useLocation();
  const { config, getBranding } = useGlobal();
  const branding = getBranding();

  const seoDefaults = useMemo(() => {
    const siteName = branding.siteName || DEFAULT_SEO.siteName;
    const defaultTitle = config?.seo?.metaTitle || siteName;
    const defaultDescription = config?.seo?.metaDescription || branding.tagline || DEFAULT_SEO.description;
    const defaultImage =
      (config?.seo?.shareImage?.url && buildImageUrl(config.seo.shareImage.url)) ||
      branding.logo ||
      DEFAULT_SEO.imagePath;

    return {
      siteName,
      defaultTitle,
      defaultDescription,
      defaultImage,
      globalKeywords: [config?.seo?.keywords, DEFAULT_SEO.keywords, branding.siteName, branding.tagline]
        .filter(Boolean)
        .join(', '),
      twitterHandle: config?.seo?.twitterHandle || '',
    };
  }, [branding.logo, branding.siteName, branding.tagline, config?.seo]);

  useEffect(() => {
    document.documentElement.dataset.pageSeo = 'true';

    const metaTitle = title
      ? title.includes(seoDefaults.siteName)
        ? title
        : `${title} | ${seoDefaults.siteName}`
      : seoDefaults.defaultTitle;
    const metaDescription = description || seoDefaults.defaultDescription;
    const canonicalUrl = buildSiteUrl(path || `${location.pathname}${location.search}`);
    const metaImage = toAbsoluteImage(image || seoDefaults.defaultImage);
    const robotsContent = noindex
      ? 'noindex,nofollow,noarchive'
      : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
    const keywordValues = Array.from(
      new Set(
        [seoDefaults.globalKeywords, ...keywords]
          .join(',')
          .split(',')
          .map((keyword) => keyword.trim())
          .filter(Boolean)
      )
    ).join(', ');

    document.documentElement.lang = 'es';
    document.title = metaTitle;

    upsertMeta('meta[name="description"]', { name: 'description' }, metaDescription);
    upsertMeta('meta[name="keywords"]', { name: 'keywords' }, keywordValues);
    upsertMeta('meta[name="robots"]', { name: 'robots' }, robotsContent);
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, metaTitle);
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, metaDescription);
    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, type);
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl);
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, metaImage);
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, seoDefaults.siteName);
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, metaTitle);
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, metaDescription);
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, metaImage);

    if (seoDefaults.twitterHandle) {
      upsertMeta('meta[name="twitter:site"]', { name: 'twitter:site' }, seoDefaults.twitterHandle);
      upsertMeta(
        'meta[name="twitter:creator"]',
        { name: 'twitter:creator' },
        seoDefaults.twitterHandle
      );
    } else {
      removeMeta('meta[name="twitter:site"]');
      removeMeta('meta[name="twitter:creator"]');
    }

    if (publishedTime) {
      upsertMeta(
        'meta[property="article:published_time"]',
        { property: 'article:published_time' },
        publishedTime
      );
    } else {
      removeMeta('meta[property="article:published_time"]');
    }

    if (modifiedTime) {
      upsertMeta(
        'meta[property="article:modified_time"]',
        { property: 'article:modified_time' },
        modifiedTime
      );
    } else {
      removeMeta('meta[property="article:modified_time"]');
    }

    upsertLink('link[rel="canonical"]', 'canonical', canonicalUrl);

    document.querySelectorAll(MANAGED_STRUCTURED_DATA_SELECTOR).forEach((node) => node.remove());

    structuredData.forEach((entry) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seoManaged = 'true';
      script.textContent = JSON.stringify(entry);
      document.head.appendChild(script);
    });

    return () => {
      delete document.documentElement.dataset.pageSeo;
      document.querySelectorAll(MANAGED_STRUCTURED_DATA_SELECTOR).forEach((node) => node.remove());
    };
  }, [
    description,
    image,
    keywords,
    location.pathname,
    location.search,
    modifiedTime,
    noindex,
    path,
    publishedTime,
    seoDefaults,
    structuredData,
    title,
    type,
  ]);

  return null;
};
