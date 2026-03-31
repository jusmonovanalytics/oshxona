
import { syncManager } from './syncManager';
import { generateId, formatDateTime } from '../utils/core';

export const logic = {
  async createProduct(name: string, unit: string) {
    const payload = {
      'product id': generateId(),
      'product': name,
      'birlik': unit,
      'sana': formatDateTime()
    };
    syncManager.enqueue('products', payload);
    return { success: true }; // Darhol qaytaradi
  },

  async createTovar(name: string, unit: string, type: string) {
    const payload = {
      'tovar id': generateId(),
      'tovar': name,
      'birlik': unit,
      'tovar turi': type,
      'sana': formatDateTime()
    };
    syncManager.enqueue('tovarlar', payload);
    return { success: true };
  },

  async createNorma(rows: any[]) {
    rows.forEach(row => syncManager.enqueue('norma', row));
    return { success: true };
  },

  async createProductKirim(productId: string, productName: string, qty: number, unit: string, price: number, manualDate: string) {
    const kirimId = generateId();
    const dt = formatDateTime();
    
    const kirimPayload = {
      'kirim id': kirimId,
      'product id': productId,
      'product': productName,
      'miqdor': qty,
      'birlik': unit,
      'narx': price,
      'summa': qty * price,
      'sana': manualDate,
      'data time': dt,
      'kirim turi': 'Kirim'
    };

    const ostatkaPayload = {
      'kirim id': kirimId,
      'product id': productId,
      'product': productName,
      'miqdor': qty,
      'fakt miqdor': qty,
      'birlik': unit,
      'narx': price,
      'summa': qty * price,
      'sana': manualDate,
      'data time': dt,
      'kirim turi': 'Kirim'
    };

    syncManager.enqueue('productKirim', kirimPayload);
    syncManager.enqueue('productOstatka', ostatkaPayload);
    
    return { success: true };
  },

  async createTovarKirimBatch(items: any[]) {
    const dt = formatDateTime();
    items.forEach(item => {
      const kId = generateId();
      syncManager.enqueue('tovarKirim', {
        'kirim id': kId,
        'tovar id': item.tovarId,
        'tovar': item.tovar,
        'tovar turi': item.tovarTuri,
        'miqdor': item.kirimMiqdori,
        'birlik': item.kirimBirligi,
        'tovar asl birlik': item.bazaviyBirlik,
        'tovar asl birlik miqdor': item.jamiBazaviyMiqdor,
        'kirim narx': item.kirimNarx,
        'kirim summa': item.totalSum,
        'sotuv narx': item.sotuvNarx || 0,
        'kirim sana': item.sana
      });

      syncManager.enqueue('tovarOstatka', {
        'kirim id': kId,
        'tovar id': item.tovarId,
        'tovar': item.tovar,
        'tovar turi': item.tovarTuri,
        'qoldiq miqdor': item.kirimMiqdori,
        'birlik': item.kirimBirligi,
        'tovar asl birlik': item.bazaviyBirlik,
        'tovar asl birlik qoldiq miqdor': item.jamiBazaviyMiqdor,
        'kirim narx': item.kirimNarx,
        'qoldiq kirim summa': item.totalSum,
        'sotuv narx': item.sotuvNarx || 0,
        'sana': item.sana,
        'data time': dt,
        'kirim turi': 'Kirim'
      });
    });
    return { success: true };
  },

  async processProduction(chiqimItems: any[], finishedFoodEntry: any, productOstatkaUpdates: any[] = []) {
    const dt = formatDateTime();
    const foodKId = generateId();

    chiqimItems.forEach(item => {
      syncManager.enqueue('productChiqim', { ...item, 'data time': dt, 'operatsiya': 'Ishlab chiqarish' });
    });

    productOstatkaUpdates.forEach(upd => {
      syncManager.enqueue('productOstatka', { ...upd, 'data time': dt });
    });

    const finalEntry = {
      ...finishedFoodEntry,
      'kirim id': foodKId,
      'tovar turi': 'Ovqat',
      'operatsiya': 'Tayyorlash',
      'sana': finishedFoodEntry['kirim sana'] || dt,
      'data time': dt
    };

    syncManager.enqueue('tovarKirim', finalEntry);
    syncManager.enqueue('tovarOstatka', { 
      ...finalEntry,
      'qoldiq miqdor': finishedFoodEntry['miqdor'],
      'tovar asl birlik qoldiq miqdor': finishedFoodEntry['tovar asl birlik miqdor'],
      'qoldiq kirim summa': finishedFoodEntry['kirim summa'],
      'kirim turi': 'Kirim'
    });

    return { success: true };
  },

  async processSale(saleItems: any[], ostatkaUpdates: any[] = []) {
    const saleId = generateId();
    saleItems.forEach(item => {
      syncManager.enqueue('tovarChiqim', { ...item, 'sotuv id': saleId });
    });

    ostatkaUpdates.forEach(upd => {
      syncManager.enqueue('tovarOstatka', upd);
    });

    return { success: true };
  }
};
