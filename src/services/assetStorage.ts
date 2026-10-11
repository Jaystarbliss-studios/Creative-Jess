const DATABASE_NAME = 'craft-workspace-assets';
const DATABASE_VERSION = 1;
const STORE_NAME = 'assets';

interface StoredAsset {
  id: string;
  name: string;
  mimeType: string;
  lastModified: number;
  blob: Blob;
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('This browser does not provide IndexedDB storage.'));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open browser asset storage.'));
    request.onblocked = () => reject(new Error('Browser asset storage upgrade is blocked by another open workspace tab.'));
  });
}

export async function storeAssetFile(id: string, file: File): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put({
        id,
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        lastModified: file.lastModified,
        blob: file,
      } satisfies StoredAsset);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Browser storage could not save the selected file.'));
      transaction.onabort = () => reject(transaction.error || new Error('Browser storage cancelled the file import.'));
    });
  } finally {
    database.close();
  }
}

export async function getAssetFile(id: string): Promise<StoredAsset | null> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve((request.result as StoredAsset | undefined) || null);
      request.onerror = () => reject(request.error || new Error('Could not read the stored file.'));
    });
  } finally {
    database.close();
  }
}

export async function removeAssetFile(id: string): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Could not remove the stored file.'));
      transaction.onabort = () => reject(transaction.error || new Error('File removal was cancelled.'));
    });
  } finally {
    database.close();
  }
}
