const DATABASE_NAME =
    'dash-images'

const DATABASE_VERSION =
    1

const STORE_NAME =
    'images'

function openDatabase():
    Promise<IDBDatabase> {
  return new Promise(
      (
          resolve,
          reject,
      ) => {
        const request =
            indexedDB.open(
                DATABASE_NAME,
                DATABASE_VERSION,
            )

        request.onupgradeneeded =
            () => {
              const database =
                  request.result

              if (
                  !database
                      .objectStoreNames
                      .contains(
                          STORE_NAME,
                      )
              ) {
                database
                    .createObjectStore(
                        STORE_NAME,
                    )
              }
            }

        request.onsuccess =
            () => {
              resolve(
                  request.result,
              )
            }

        request.onerror =
            () => {
              reject(
                  request.error,
              )
            }
      },
  )
}

export type StoredImage = {
  blob: Blob
  fileName: string | null
  mimeType: string | null
  width: number | null
  height: number | null
  createdAt: number
}

type SaveImageMetadata = {
  fileName: string | null
  mimeType: string | null
  width: number | null
  height: number | null
}

export async function saveImage(
    id: string,
    blob: Blob,
    metadata: SaveImageMetadata,
) {
  const database =
      await openDatabase()

  return new Promise<void>(
      (
          resolve,
          reject,
      ) => {
        const transaction =
            database.transaction(
                STORE_NAME,
                'readwrite',
            )

        const store =
            transaction.objectStore(
                STORE_NAME,
            )

        store.put(
            {
              blob,
              fileName:
              metadata.fileName,
              mimeType:
              metadata.mimeType,
              width:
              metadata.width,
              height:
              metadata.height,
              createdAt:
                  Date.now(),
            },
            id,
        )

        transaction.oncomplete =
            () => {
              database.close()
              resolve()
            }

        transaction.onerror =
            () => {
              database.close()

              reject(
                  transaction.error,
              )
            }
      },
  )
}

export async function loadImage(
    id: string,
): Promise<StoredImage | null> {
  const database =
      await openDatabase()

  return new Promise(
      (
          resolve,
          reject,
      ) => {
        const transaction =
            database.transaction(
                STORE_NAME,
                'readonly',
            )

        const store =
            transaction.objectStore(
                STORE_NAME,
            )

        const request =
            store.get(
                id,
            )

        request.onsuccess =
            () => {
              database.close()

              resolve(
                  request.result ??
                  null,
              )
            }

        request.onerror =
            () => {
              database.close()

              reject(
                  request.error,
              )
            }
      },
  )
}

export async function deleteImage(
    id: string,
) {
  const database =
      await openDatabase()

  return new Promise<void>(
      (
          resolve,
          reject,
      ) => {
        const transaction =
            database.transaction(
                STORE_NAME,
                'readwrite',
            )

        transaction
            .objectStore(
                STORE_NAME,
            )
            .delete(
                id,
            )

        transaction.oncomplete =
            () => {
              database.close()
              resolve()
            }

        transaction.onerror =
            () => {
              database.close()

              reject(
                  transaction.error,
              )
            }
      },
  )
}
