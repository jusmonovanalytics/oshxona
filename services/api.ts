
export const URLS = {
  products: 'https://script.google.com/macros/s/AKfycbzpomd9pruGPFJhd-Chz6zi7PXce7Nre6WgONAsedOabLUsxydl9XGtPOLCk8Ntcgr9/exec',
  productKirim: 'https://script.google.com/macros/s/AKfycbwyQ-42TNEA1BDEaDoQzFQynTfreod-ZpXhc8KzmOS9p9O5XJcDfTtBA_G4LwfTurslkA/exec',
  productChiqim: 'https://script.google.com/macros/s/AKfycbzcYQUueRD4pa0O6c8TZ06ApVLJM83u6lQnDw41KqLqaqr_DEjRfxsMy7dsjc-62qdXaw/exec',
  productOstatka: 'https://script.google.com/macros/s/AKfycbyaDZmS7IzgX9PK-1HYCMZV4SySVhTgXUal-VPrc4jkskO7leUG6wObEvFPSKq6zNAV/exec',
  tovarlar: 'https://script.google.com/macros/s/AKfycbxHdoV6RtsOaKBXCQHY8omKDf7MGu22O4a-ZCe2S_ZoABqygqzWVP64BRAOAJCoiQSJ/exec',
  tovarKirim: 'https://script.google.com/macros/s/AKfycbxNRxYK-z-Muv_73xqQ6DFu0ukSuJxUmYu3sdLqmkyvfPbS9P2bJw_BT-L7dQE7zKk_/exec',
  tovarChiqim: 'https://script.google.com/macros/s/AKfycbwDnPvef_i-Vfvk16jv4BmL6p6UZ2mMSC7xTqvhgBEeroDFvFqUamjjoK33WqSn_mZm/exec',
  tovarOstatka: 'https://script.google.com/macros/s/AKfycbwzdBcs6I-aM9yD9j-__AnwA2RqDgPYFt5mAHhlPwupNxVjERSPS3k_l7rz1G569jGO/exec',
  norma: 'https://script.google.com/macros/s/AKfycbxlELnYu09czLVyS2IBaOGxA6GhTUDry_R2hiwX36zgVe6sWcKakj5dtArolkx3YJZVNg/exec',
  xodimlar: 'https://script.google.com/macros/s/AKfycbyD6C3V6dvyJr7LgRzmcExg2t4qydpMV9kYTgtJXR3ZuxQu-Ur_uwHP9DKbCqLlF38S/exec'
};

export const fetchData = async (target: keyof typeof URLS) => {
  try {
    const response = await fetch(URLS[target]);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${target}:`, error);
    return [];
  }
};

/**
 * Ma'lumotlarni Google Sheets'ga yuborish
 */
export const postData = async (target: keyof typeof URLS, payload: any) => {
  try {
    const response = await fetch(URLS[target], {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script POST uchun zarur
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return { success: true };
  } catch (error) {
    console.error(`Error posting to ${target}:`, error);
    return { success: false, error };
  }
};

/**
 * @constant 1: Integratsiyani tekshirish funksiyasi
 */
export const checkConnection = async (target: keyof typeof URLS): Promise<{status: boolean, time: number}> => {
  const start = Date.now();
  try {
    const response = await fetch(URLS[target], { method: 'HEAD', mode: 'no-cors' });
    return { status: true, time: Date.now() - start };
  } catch (e) {
    return { status: false, time: 0 };
  }
};
