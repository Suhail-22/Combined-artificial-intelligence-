const DB_NAME = 'TriCoderDB';
const DB_VERSION = 1;

export const dbHelper = {
  open: () => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('folders')) {
          db.createObjectStore('folders', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  getAll: async (storeName: string) => {
    const db = await dbHelper.open();
    return new Promise<any[]>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  put: async (storeName: string, item: any) => {
    const db = await dbHelper.open();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  delete: async (storeName: string, id: string) => {
    const db = await dbHelper.open();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  clear: async (storeName: string) => {
     const db = await dbHelper.open();
     return new Promise<void>((resolve, reject) => {
       const transaction = db.transaction(storeName, 'readwrite');
       const store = transaction.objectStore(storeName);
       const request = store.clear();
       request.onsuccess = () => resolve();
       request.onerror = () => reject(request.error);
     });
  }
};
