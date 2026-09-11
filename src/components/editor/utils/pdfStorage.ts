const DATABASE_NAME = 'dash-pdfs'

const DATABASE_VERSION = 1

const STORE_NAME = 'pdfs'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

export type StoredPdf = {
  blob: Blob
  fileName: string | null
  mimeType: string | null
  size: number | null
  createdAt: number
}

type SavePdfMetadata = {
  fileName: string | null
  mimeType: string | null
  size: number | null
}

export async function savePdf(
  id: string,
  blob: Blob,
  metadata: SavePdfMetadata,
) {
  const database = await openDatabase()

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')

    const store = transaction.objectStore(STORE_NAME)

    store.put(
      {
        blob,
        fileName: metadata.fileName,
        mimeType: metadata.mimeType,
        size: metadata.size,
        createdAt: Date.now(),
      },
      id,
    )

    transaction.oncomplete = () => {
      database.close()
      resolve()
    }

    transaction.onerror = () => {
      database.close()

      reject(transaction.error)
    }
  })
}

export async function loadPdf(id: string): Promise<StoredPdf | null> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly')

    const store = transaction.objectStore(STORE_NAME)

    const request = store.get(id)

    request.onsuccess = () => {
      database.close()

      resolve(request.result ?? null)
    }

    request.onerror = () => {
      database.close()

      reject(request.error)
    }
  })
}

export async function deletePdf(id: string) {
  const database = await openDatabase()

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')

    transaction.objectStore(STORE_NAME).delete(id)

    transaction.oncomplete = () => {
      database.close()
      resolve()
    }

    transaction.onerror = () => {
      database.close()

      reject(transaction.error)
    }
  })
}
