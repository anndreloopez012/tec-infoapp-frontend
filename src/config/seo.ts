export const DEFAULT_SITE_URL = import.meta.env.VITE_SITE_URL || 'https://app.tec.gt';

export const DEFAULT_SEO = {
  siteName: 'Tec Community',
  description:
    'Tec Community centraliza la información más importante para que cada Tec member viva una experiencia más cercana, dinámica e informada dentro de la comunidad.',
  keywords:
    'Tec Community, comunidad Tec, Campus Tecnologico Tec, eventos, noticias, calendario, empresas, galeria, Guatemala',
  imagePath: '/icon-512x512.png',
};

export const buildSiteUrl = (value = '/') => {
  if (!value) return DEFAULT_SITE_URL;
  if (/^https?:\/\//i.test(value)) return value;
  return `${DEFAULT_SITE_URL}${value.startsWith('/') ? value : `/${value}`}`;
};
