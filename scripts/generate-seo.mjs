import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const apiConfigPath = path.join(projectRoot, 'src/config/api.js');

const SITE_URL = process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://app.tec.gt';
const nowIso = new Date().toISOString();

const buildUrl = (value) => `${SITE_URL}${value.startsWith('/') ? value : `/${value}`}`;

const xmlEscape = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const readApiConfig = async () => {
  const file = await fs.readFile(apiConfigPath, 'utf8');
  const extract = (pattern, fallback = '') => file.match(pattern)?.[1] || fallback;

  return {
    baseUrl: process.env.API_BASE_URL || extract(/BASE_URL:\s*"([^"]+)"/, 'https://api-app.tec.gt'),
    apiPrefix: process.env.API_PREFIX || extract(/API_PREFIX:\s*"([^"]+)"/, 'api'),
    token: process.env.SEO_AUTH_TOKEN || extract(/AUTH_TOKEN:\s*"([^"]+)"/, ''),
  };
};

const fetchCollection = async (config, endpoint, query = '') => {
  const url = `${config.baseUrl}/${config.apiPrefix}/${endpoint}${query ? `?${query}` : ''}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    return payload.data || [];
  } catch (error) {
    console.warn(`SEO: no se pudo obtener ${endpoint}: ${error.message}`);
    return [];
  }
};

const buildSitemapEntry = (route, lastmod = nowIso, priority = '0.7', changefreq = 'weekly') => `  <url>
    <loc>${xmlEscape(buildUrl(route))}</loc>
    <lastmod>${xmlEscape(new Date(lastmod).toISOString())}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

const main = async () => {
  const apiConfig = await readApiConfig();

  const staticRoutes = [
    { route: '/', priority: '1.0', changefreq: 'daily' },
    { route: '/public/calendar', priority: '0.9', changefreq: 'daily' },
    { route: '/public/events', priority: '0.9', changefreq: 'daily' },
    { route: '/public/gallery', priority: '0.8', changefreq: 'weekly' },
    { route: '/public/companies', priority: '0.8', changefreq: 'weekly' },
    { route: '/politicas-seguridad', priority: '0.4', changefreq: 'yearly' },
    { route: '/terminos-y-condiciones', priority: '0.4', changefreq: 'yearly' },
    { route: '/eliminar-cuenta', priority: '0.4', changefreq: 'yearly' },
  ];

  const [categories, events, contents] = await Promise.all([
    fetchCollection(
      apiConfig,
      'content-categories',
      'pagination[pageSize]=200&filters[show_in_public_menu][$eq]=true&sort=name:asc'
    ),
    fetchCollection(
      apiConfig,
      'events',
      'pagination[pageSize]=500&filters[active][$eq]=true&sort=start_date:desc'
    ),
    fetchCollection(
      apiConfig,
      'content-infos',
      'pagination[pageSize]=500&populate=*&filters[status_content][$eq]=published&filters[active][$eq]=true&sort=publish_date:desc'
    ),
  ]);

  const dynamicRoutes = [
    ...categories
      .filter((item) => item?.documentId)
      .map((item) => ({
        route: `/public/category/${item.documentId}`,
        lastmod: item.updatedAt || nowIso,
        priority: '0.8',
        changefreq: 'weekly',
      })),
    ...events
      .filter((item) => item?.documentId)
      .map((item) => ({
        route: `/public/events/${item.documentId}`,
        lastmod: item.updatedAt || item.start_date || nowIso,
        priority: '0.8',
        changefreq: 'weekly',
      })),
    ...contents
      .filter((item) => item?.documentId)
      .filter((item) => !item.companies || item.companies.length === 0)
      .map((item) => ({
        route: `/public/content/${item.documentId}`,
        lastmod: item.updatedAt || item.publish_date || nowIso,
        priority: '0.8',
        changefreq: 'weekly',
      })),
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticRoutes, ...dynamicRoutes]
  .map((entry) => buildSitemapEntry(entry.route, entry.lastmod, entry.priority, entry.changefreq))
  .join('\n')}
</urlset>
`;

  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${buildUrl('/sitemap.xml')}
Host: ${SITE_URL.replace(/^https?:\/\//, '')}
`;

  await fs.writeFile(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf8');
  await fs.writeFile(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf8');

  console.log(
    `SEO: sitemap generado con ${staticRoutes.length + dynamicRoutes.length} URLs y robots.txt actualizado`
  );
};

main().catch((error) => {
  console.warn(`SEO: generación parcial por error: ${error.message}`);
  process.exit(0);
});
