const BUSINESS_TZ_OFFSET_MINUTES = 330; // IST is UTC+5:30

/**
 * Formats a date string into Indian/civil standard: DD-Mon-YYYY (e.g. 09-Oct-2026)
 */
export const formatCivilDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Formats an instant or date string into business clock time: HH:mm in IST (e.g. 23:55)
 */
export const formatBusinessTime = (instant) => {
  if (!instant) return '';
  const d = new Date(new Date(instant).getTime() + BUSINESS_TZ_OFFSET_MINUTES * 60000);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};
