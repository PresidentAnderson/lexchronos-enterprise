// IndexedDB wrapper for offline data storage and synchronization

interface StorageItem {
  id: string;
  data: any;
  timestamp: number;
  synced: boolean;
  operation: 'create' | 'update' | 'delete';
  tableName: string;
}

interface SyncQueueItem {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private dbName = 'lexchronos-offline';
  private dbVersion = 1;
  private stores = {
    cases: 'cases',
    documents: 'documents',
    timeline: 'timeline',
    syncQueue: 'syncQueue',
    settings: 'settings',
  };

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Cases store
        if (!db.objectStoreNames.contains(this.stores.cases)) {
          const casesStore = db.createObjectStore(this.stores.cases, { keyPath: 'id' });
          casesStore.createIndex('synced', 'synced', { unique: false });
          casesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Documents store
        if (!db.objectStoreNames.contains(this.stores.documents)) {
          const docsStore = db.createObjectStore(this.stores.documents, { keyPath: 'id' });
          docsStore.createIndex('caseId', 'data.caseId', { unique: false });
          docsStore.createIndex('synced', 'synced', { unique: false });
          docsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Timeline store
        if (!db.objectStoreNames.contains(this.stores.timeline)) {
          const timelineStore = db.createObjectStore(this.stores.timeline, { keyPath: 'id' });
          timelineStore.createIndex('caseId', 'data.caseId', { unique: false });
          timelineStore.createIndex('synced', 'synced', { unique: false });
          timelineStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains(this.stores.syncQueue)) {
          const syncStore = db.createObjectStore(this.stores.syncQueue, { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('retryCount', 'retryCount', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains(this.stores.settings)) {
          db.createObjectStore(this.stores.settings, { keyPath: 'key' });
        }
      };
    });
  }

  private async waitForDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    
    await this.initDB();
    if (!this.db) throw new Error('Failed to initialize database');
    return this.db;
  }

  // Generic CRUD operations
  async save(storeName: string, data: any, operation: 'create' | 'update' = 'create'): Promise<void> {
    const db = await this.waitForDB();
    const id = data.id || this.generateId();
    
    const item: StorageItem = {
      id,
      data: { ...data, id },
      timestamp: Date.now(),
      synced: false,
      operation,
      tableName: storeName,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => {
        // Add to sync queue
        this.addToSyncQueue(operation === 'create' ? 'POST' : 'PUT', `/api/${storeName}`, item.data);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName: string, id: string): Promise<StorageItem | null> {
    const db = await this.waitForDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName: string, filters?: { synced?: boolean; caseId?: string }): Promise<StorageItem[]> {
    const db = await this.waitForDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      let request: IDBRequest;

      if (filters?.synced !== undefined) {
        const index = store.index('synced');
        request = index.getAll(filters.synced);
      } else if (filters?.caseId) {
        const index = store.index('caseId');
        request = index.getAll(filters.caseId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        let results = request.result || [];
        
        // Sort by timestamp (newest first)
        results.sort((a, b) => b.timestamp - a.timestamp);
        
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.waitForDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // First get the item to check if it was synced
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        
        if (item && item.synced) {
          // If synced, mark for deletion and add to sync queue
          item.operation = 'delete';
          item.synced = false;
          item.timestamp = Date.now();
          
          const putRequest = store.put(item);
          putRequest.onsuccess = () => {
            this.addToSyncQueue('DELETE', `/api/${storeName}/${id}`, null);
            resolve();
          };
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          // If not synced, just delete locally
          const deleteRequest = store.delete(id);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Sync queue management
  private async addToSyncQueue(method: 'POST' | 'PUT' | 'DELETE', url: string, data?: any): Promise<void> {
    const db = await this.waitForDB();
    
    const queueItem: SyncQueueItem = {
      id: this.generateId(),
      method,
      url,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.stores.syncQueue], 'readwrite');
      const store = transaction.objectStore(this.stores.syncQueue);
      const request = store.add(queueItem);

      request.onsuccess = () => {
        // Trigger sync if online
        if (navigator.onLine) {
          this.processSyncQueue();
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async processSyncQueue(): Promise<void> {
    if (!navigator.onLine) return;

    const db = await this.waitForDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.stores.syncQueue], 'readwrite');
      const store = transaction.objectStore(this.stores.syncQueue);
      const request = store.getAll();

      request.onsuccess = async () => {
        const queueItems: SyncQueueItem[] = request.result || [];
        
        for (const item of queueItems) {
          try {
            const success = await this.syncItem(item);
            
            if (success) {
              // Remove from queue
              store.delete(item.id);
              
              // Mark original item as synced if it's not a delete operation
              if (item.method !== 'DELETE' && item.data?.id) {
                await this.markAsSynced(item.url.split('/')[2], item.data.id);
              }
            } else {
              // Increment retry count
              item.retryCount++;
              if (item.retryCount < item.maxRetries) {
                store.put(item);
              } else {
                // Max retries reached, remove from queue
                store.delete(item.id);
                console.error('Max retries reached for sync item:', item);
              }
            }
          } catch (error) {
            console.error('Error processing sync item:', error);
            item.retryCount++;
            if (item.retryCount < item.maxRetries) {
              store.put(item);
            } else {
              store.delete(item.id);
            }
          }
        }
        
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  private async syncItem(item: SyncQueueItem): Promise<boolean> {
    try {
      const options: RequestInit = {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers here
        },
      };

      if (item.data) {
        options.body = JSON.stringify(item.data);
      }

      const response = await fetch(item.url, options);
      return response.ok;
    } catch (error) {
      console.error('Sync error:', error);
      return false;
    }
  }

  private async markAsSynced(storeName: string, id: string): Promise<void> {
    const db = await this.waitForDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const item = request.result;
        if (item) {
          item.synced = true;
          const putRequest = store.put(item);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    const db = await this.waitForDB();
    const storeNames = Object.values(this.stores);
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeNames, 'readwrite');
      let completed = 0;
      
      for (const storeName of storeNames) {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => {
          completed++;
          if (completed === storeNames.length) {
            resolve();
          }
        };
        
        request.onerror = () => reject(request.error);
      }
    });
  }

  async getStorageInfo(): Promise<{ [key: string]: number }> {
    const db = await this.waitForDB();
    const info: { [key: string]: number } = {};
    
    for (const [key, storeName] of Object.entries(this.stores)) {
      const count = await this.getStoreCount(storeName);
      info[key] = count;
    }
    
    return info;
  }

  private async getStoreCount(storeName: string): Promise<number> {
    const db = await this.waitForDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Settings management
  async getSetting(key: string): Promise<any> {
    const db = await this.waitForDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.stores.settings], 'readonly');
      const store = transaction.objectStore(this.stores.settings);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async setSetting(key: string, value: any): Promise<void> {
    const db = await this.waitForDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.stores.settings], 'readwrite');
      const store = transaction.objectStore(this.stores.settings);
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Event listeners for online/offline
  setupSyncListeners(): void {
    window.addEventListener('online', () => {
      console.log('Device came online, processing sync queue');
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      console.log('Device went offline');
    });
  }
}

// Create singleton instance
export const offlineStorage = new OfflineStorage();

// Auto-setup sync listeners
if (typeof window !== 'undefined') {
  offlineStorage.setupSyncListeners();
}

// React hook for offline storage
import { useEffect, useState } from 'react';

export function useOfflineStorage<T>(storeName: string, id?: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (id) {
          const item = await offlineStorage.get(storeName, id);
          setData(item?.data || null);
        } else {
          const items = await offlineStorage.getAll(storeName);
          setData(items.map(item => item.data) as any);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error loading offline data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [storeName, id]);

  const save = async (newData: T) => {
    try {
      await offlineStorage.save(storeName, newData);
      setData(newData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      throw err;
    }
  };

  const remove = async (itemId: string) => {
    try {
      await offlineStorage.delete(storeName, itemId);
      if (Array.isArray(data)) {
        setData((data as any[]).filter((item: any) => item.id !== itemId) as any);
      } else if ((data as any)?.id === itemId) {
        setData(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      throw err;
    }
  };

  return { data, loading, error, save, remove, reload: () => loadData() };
}