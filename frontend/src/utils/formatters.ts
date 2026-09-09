/**
 * Institutional Financial Formatters for WealthOps (Indian Standard Time & INR Currency)
 */

/**
 * Format a numeric amount into Indian Rupee (INR) currency representation
 * e.g. 8400000 -> ₹84,00,000.00 or ₹8.40 Cr
 */
export function formatINR(
  val: number | null | undefined,
  options?: { decimals?: number; compact?: boolean }
): string {
  if (val === null || val === undefined || isNaN(Number(val))) {
    return '₹0';
  }

  const num = Number(val);

  if (options?.compact) {
    if (Math.abs(num) >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(num) >= 100000) {
      return `₹${(num / 100000).toFixed(2)} L`;
    }
  }

  const decimals = options?.decimals !== undefined ? options.decimals : 0;
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Format full date and time in Indian Standard Time (IST, UTC+05:30)
 * e.g. "09 Sep 2026 · 23:25:10 IST"
 */
export function formatIST(dateInput?: string | number | Date | null): string {
  if (!dateInput) return 'N/A';
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return 'N/A';

  const dateStr = d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const timeStr = d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return `${dateStr} · ${timeStr} IST`;
}

/**
 * Format time only in Indian Standard Time (IST)
 * e.g. "23:25:10 IST"
 */
export function formatISTTime(dateInput?: string | number | Date | null): string {
  if (!dateInput) return 'N/A';
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return 'N/A';

  return (
    d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }) + ' IST'
  );
}
