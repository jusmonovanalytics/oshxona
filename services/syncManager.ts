
import { postData, URLS } from './api';

export interface SyncTask {
  id: string;
  target: keyof typeof URLS;
  payload: any;
  timestamp: number;
  retryCount: number;
}

type SyncStatus = 'idle' | 'syncing' | 'error';

class SyncManager {
  private queue: SyncTask[] = [];
  private isProcessing = false;
  private status: SyncStatus = 'idle';
  private listeners: ((status: SyncStatus, pendingCount: number) => void)[] = [];

  constructor() {
    this.loadQueue();
    // Dastur yuklanganda avtomatik sinxronlashni boshlash
    setTimeout(() => this.processQueue(), 2000);
  }

  private loadQueue() {
    const saved = localStorage.getItem('erp_sync_queue');
    if (saved) {
      try {
        this.queue = JSON.parse(saved);
      } catch (e) {
        this.queue = [];
      }
    }
  }

  private saveQueue() {
    localStorage.setItem('erp_sync_queue', JSON.stringify(this.queue));
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l(this.status, this.queue.length));
  }

  public subscribe(callback: (status: SyncStatus, pendingCount: number) => void) {
    this.listeners.push(callback);
    callback(this.status, this.queue.length);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Ma'lumotni navbatga qo'shish (Non-blocking)
   */
  public enqueue(target: keyof typeof URLS, payload: any) {
    const task: SyncTask = {
      id: Math.random().toString(36).substr(2, 9),
      target,
      payload,
      timestamp: Date.now(),
      retryCount: 0
    };
    this.queue.push(task);
    this.saveQueue();
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      this.status = 'idle';
      this.notify();
      return;
    }

    this.isProcessing = true;
    this.status = 'syncing';
    this.notify();

    while (this.queue.length > 0) {
      const task = this.queue[0];
      
      try {
        const result = await postData(task.target, task.payload);
        
        // Google Sheets mode: no-cors bo'lsa natijani muvaffaqiyatli deb hisoblaymiz
        // Agar response.ok bo'lmasa, postData xato qaytaradi
        if (result.success) {
          this.queue.shift(); // Birinchi elementni o'chirish
          this.saveQueue();
          // Har bir yozuv orasida 200ms tanaffus (serverni qiynamaslik uchun)
          await new Promise(r => setTimeout(r, 200));
        } else {
          throw new Error("Sync failed");
        }
      } catch (error) {
        console.error("Sync error, retrying in 5s...", error);
        this.status = 'error';
        this.notify();
        this.isProcessing = false;
        
        // 5 soniyadan keyin qayta urinish
        setTimeout(() => this.processQueue(), 5000);
        return;
      }
    }

    this.isProcessing = false;
    this.status = 'idle';
    this.notify();
  }
}

export const syncManager = new SyncManager();
