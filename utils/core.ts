
/**
 * @constant 2: Unikal ID generatsiyasi (7 belgi)
 */
export const generateId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * @constant 3: Sana va vaqt formati (YYYY-MM-DD HH:MM:SS)
 */
export const formatDateTime = (date?: Date | string | number): string => {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) return 'Noma\'lum sana';
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Input type="datetime-local" qiymatini tizim formatiga o'tkazish
 */
export const fromInputToSystemDate = (inputValue: string): string => {
  if (!inputValue) return formatDateTime();
  const d = new Date(inputValue);
  return formatDateTime(d);
};

/**
 * Hozirgi vaqtni input type="datetime-local" formatiga o'tkazish (YYYY-MM-DDTHH:mm)
 */
export const toInputDateTime = (date?: Date): string => {
  const d = date || new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Raqamlarni valyuta formatiga keltirish (Standart)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Katta sonlarni qisqartirib ko'rsatish (Dashboard uchun)
 */
export const formatCompactNumber = (amount: number): string => {
  const absAmount = Math.abs(amount);
  if (absAmount >= 1_000_000_000) {
    return (amount / 1_000_000_000).toLocaleString('uz-UZ', { maximumFractionDigits: 2 }) + ' mlrd';
  }
  if (absAmount >= 1_000_000) {
    return (amount / 1_000_000).toLocaleString('uz-UZ', { maximumFractionDigits: 2 }) + ' mln';
  }
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(amount);
};
