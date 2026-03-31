
import { fetchData, postData } from './api';
import { formatDateTime } from '../utils/core';

export const inventoryService = {
  /**
   * Mahsulotlar qoldiqlarini qayta hisoblash va Ostatka jadvaliga yozish
   */
  async syncAllProductBalances(onProgress?: (msg: string) => void) {
    try {
      onProgress?.("Ma'lumotlar yig'ilmoqda...");
      const [allKirim, allChiqim] = await Promise.all([
        fetchData('productKirim'),
        fetchData('productChiqim')
      ]);

      const kirimlar = Array.isArray(allKirim) ? allKirim : [];
      const chiqimlar = Array.isArray(allChiqim) ? allChiqim : [];

      const batches = kirimlar.filter(k => k['kirim turi'] === 'Kirim' || !k['kirim turi']);
      onProgress?.(`Jami ${batches.length} partiya tahlil qilinmoqda...`);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const bId = batch['kirim id'];
        
        const totalUsedNorma = chiqimlar
          .filter(c => c['kirim id'] === bId)
          .reduce((sum, c) => sum + (Number(c['miqdor']) || 0), 0);

        const totalUsedFakt = chiqimlar
          .filter(c => c['kirim id'] === bId)
          .reduce((sum, c) => sum + (Number(c['fakt miqdor'] || c['miqdor']) || 0), 0);

        const currentQtyNorma = (Number(batch['miqdor']) || 0) - totalUsedNorma;
        const currentQtyFakt = (Number(batch['miqdor']) || 0) - totalUsedFakt;
        const price = Number(batch['narx']) || 0;

        await postData('productOstatka', {
          'kirim id': bId,
          'product id': batch['product id'],
          'product': batch['product'],
          'miqdor': Number(currentQtyNorma.toFixed(4)),
          'fakt miqdor': Number(currentQtyFakt.toFixed(4)),
          'birlik': batch['birlik'],
          'narx': price,
          'summa': Number((currentQtyFakt * price).toFixed(2)),
          'kirim sana': batch['sana'],
          'sana': batch['sana'], // Markaziy sana qo'shildi
          'data time': formatDateTime(),
          'kirim turi': 'Qoldiq'
        });
        onProgress?.(`Mahsulotlar: ${i + 1}/${batches.length}`);
      }
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  },

  /**
   * Tovarlar qoldiqlarini qayta hisoblash
   */
  async syncAllTovarBalances(onProgress?: (msg: string) => void) {
    try {
      onProgress?.("Tovar ma'lumotlari yig'ilmoqda...");
      const [allKirim, allChiqim] = await Promise.all([
        fetchData('tovarKirim'),
        fetchData('tovarChiqim')
      ]);

      const kirimlar = Array.isArray(allKirim) ? allKirim : [];
      const chiqimlar = Array.isArray(allChiqim) ? allChiqim : [];

      onProgress?.(`Jami ${kirimlar.length} tovar partiyasi tahlil qilinmoqda...`);

      for (let i = 0; i < kirimlar.length; i++) {
        const batch = kirimlar[i];
        const bId = batch['kirim id'];

        const usedAsl = chiqimlar
          .filter(c => c['kirim id'] === bId)
          .reduce((sum, c) => sum + (Number(c['tovar asl birlik qoldiq miqdor']) || 0), 0);

        const initialAsl = Number(batch['tovar asl birlik miqdor']) || 1;
        const currentAsl = Math.max(0, initialAsl - usedAsl);
        
        const initialSec = Number(batch['miqdor']) || 0;
        const currentSec = initialAsl > 0 ? (currentAsl / initialAsl) * initialSec : 0;
        const kirimNarx = Number(batch['kirim narx']) || 0;

        await postData('tovarOstatka', {
          'kirim id': bId,
          'tovar id': batch['tovar id'],
          'tovar': batch['tovar'],
          'tovar turi': batch['tovar turi'],
          'qoldiq miqdor': Number(currentSec.toFixed(4)),
          'birlik': batch['birlik'],
          'tovar asl birlik': batch['tovar asl birlik'],
          'tovar asl birlik qoldiq miqdor': Number(currentAsl.toFixed(4)),
          'kirim narx': kirimNarx,
          'qoldiq kirim summa': Number((currentAsl * kirimNarx).toFixed(2)),
          'sotuv narx': Number(batch['sotuv narx']) || 0,
          'sana': batch['kirim sana'] || formatDateTime(), // Markaziy sana qo'shildi
          'data time': formatDateTime(),
          'kirim turi': 'Qoldiq'
        });
        onProgress?.(`Tovarlar: ${i + 1}/${kirimlar.length}`);
      }
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  }
};
