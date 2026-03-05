
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

/**
 * SWR (Stale-While-Revalidate) caching logic
 */
export const fetchData = async (target: keyof typeof URLS, useCache = true) => {
  const cacheKey = `cache_${target}`;
  
  if (useCache) {
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      // Background revalidation
      fetch(URLS[target], { priority: 'low' })
        .then(res => res.json())
        .then(data => localStorage.setItem(cacheKey, JSON.stringify(data)))
        .catch(() => {});
      return JSON.parse(cachedData);
    }
  }

  try {
    const response = await fetch(URLS[target], { 
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error('Network error');
    const data = await response.json();
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (error) {
    const fallback = localStorage.getItem(cacheKey);
    return fallback ? JSON.parse(fallback) : [];
  }
};

export const postData = async (target: keyof typeof URLS, payload: any) => {
  try {
    const response = await fetch(URLS[target], {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    localStorage.removeItem(`cache_${target}`);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * Tarmoq kechikishini o'lchash (Network Latency)
 */
export const checkConnection = async (target: keyof typeof URLS): Promise<{status: boolean, time: number}> => {
  const start = performance.now();
  try {
    // GAS URLs don't support HEAD properly, so we use a very limited fetch
    await fetch(URLS[target], { 
      method: 'GET', 
      mode: 'no-cors', 
      cache: 'no-store',
      credentials: 'omit'
    });
    return { status: true, time: Math.round(performance.now() - start) };
  } catch (e) {
    return { status: false, time: 0 };
  }
};
