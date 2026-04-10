const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_PREFIX_PATTERN = /^(\d{4}-\d{2}-\d{2})/;

const buildLocalNoonDate = (dateString: string) => {
  const match = DATE_ONLY_PATTERN.exec(dateString);
  if (!match) {
    return new Date(dateString);
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
};

export const toDateInputValue = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const match = DATE_PREFIX_PATTERN.exec(value);
  return match ? match[1] : value;
};

export const toStableStrapiDateTime = (dateString?: string | null) => {
  if (!dateString) {
    return null;
  }

  return buildLocalNoonDate(dateString).toISOString();
};

export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const formatCalendarDate = (
  value?: string | null,
  locale = "es-GT",
  options?: Intl.DateTimeFormatOptions
) => {
  if (!value) {
    return "";
  }

  const normalizedDate = toDateInputValue(value);
  const date = normalizedDate ? buildLocalNoonDate(normalizedDate) : new Date(value);

  return new Intl.DateTimeFormat(locale, options ?? {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};
