import type { Category } from '../types/Category.ts'
import type { Note } from '../types/Note.ts'
import type { NoteFolder } from '../types/NoteFolder.ts'

export const NOTES_INBOX_FOLDER_ID = 'system:inbox'
export const NOTES_TRASH_FOLDER_ID = 'system:trash'

const CATEGORY_FOLDER_PREFIX = 'category:'

export type NoteTreeFolderKind = 'inbox' | 'category' | 'folder' | 'trash'

export type NoteTreeFolderNode = {
  id: string
  name: string
  kind: NoteTreeFolderKind
  color: string | null
  parentId: string | null
  folder: NoteFolder | null
  childFolders: NoteTreeFolderNode[]
  notes: Note[]
}

export type NoteTree = {
  roots: NoteTreeFolderNode[]
  trash: NoteTreeFolderNode
}

type UnknownRecord = Record<string, unknown>

export function getCategoryFolderId(categoryId: string) {
  return `${CATEGORY_FOLDER_PREFIX}${categoryId}`
}

export function getCategoryIdFromFolderId(folderId: string | null | undefined) {
  if (!folderId?.startsWith(CATEGORY_FOLDER_PREFIX)) {
    return null
  }

  return folderId.slice(CATEGORY_FOLDER_PREFIX.length) || null
}

export function isSystemFolderId(folderId: string) {
  return (
    folderId === NOTES_INBOX_FOLDER_ID ||
    folderId === NOTES_TRASH_FOLDER_ID ||
    getCategoryIdFromFolderId(folderId) !== null
  )
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : null
}

function getStoredDeletedAt(value: unknown) {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

export function normalizeStoredNoteFolders(value: unknown): NoteFolder[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return []
    }

    const id = getString(item.id)

    if (!id || isSystemFolderId(id)) {
      return []
    }

    const now = new Date().toISOString()

    return [
      {
        id,
        name: getString(item.name)?.trim() || 'Untitled folder',
        parentId: getString(item.parentId) ?? NOTES_INBOX_FOLDER_ID,
        createdAt: getString(item.createdAt) ?? now,
        updatedAt: getString(item.updatedAt) ?? getString(item.createdAt) ?? now,
        deletedAt: getStoredDeletedAt(item.deletedAt),
      },
    ]
  })
}

export function normalizeStoredNotes(
  value: unknown,
  categories: Category[],
  folders: NoteFolder[],
): Note[] {
  if (!Array.isArray(value)) {
    return []
  }

  const categoryIds = new Set(categories.map((category) => category.id))
  const folderIds = new Set(folders.map((folder) => folder.id))

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return []
    }

    const id = getString(item.id)
    const createdAt = getString(item.createdAt)
    const updatedAt = getString(item.updatedAt)

    if (!id || !createdAt || !updatedAt || !('document' in item)) {
      return []
    }

    const categoryId = getString(item.categoryId)
    const storedFolderId = getString(item.folderId)
    const deletedAt = getStoredDeletedAt(item.deletedAt)
    const inferredCategoryFolderId =
      categoryId && categoryIds.has(categoryId)
        ? getCategoryFolderId(categoryId)
        : null

    let folderId =
      storedFolderId && isKnownFolderId(categories, folders, storedFolderId)
        ? storedFolderId
        : inferredCategoryFolderId ?? NOTES_INBOX_FOLDER_ID

    if (
      storedFolderId?.startsWith(CATEGORY_FOLDER_PREFIX) &&
      !isKnownFolderId(categories, folders, storedFolderId)
    ) {
      folderId = NOTES_TRASH_FOLDER_ID
    }

    if (storedFolderId && folderIds.has(storedFolderId)) {
      folderId = storedFolderId
    }

    if (deletedAt && !storedFolderId) {
      folderId = NOTES_TRASH_FOLDER_ID
    }

    return [
      {
        ...(item as Note),
        id,
        title: getString(item.title) ?? 'Untitled',
        document: item.document as Note['document'],
        categoryId: categoryId && categoryIds.has(categoryId) ? categoryId : null,
        folderId,
        createdAt,
        updatedAt,
        deletedAt,
      },
    ]
  })
}

export function isKnownFolderId(
  categories: Category[],
  folders: NoteFolder[],
  folderId: string,
) {
  if (
    folderId === NOTES_INBOX_FOLDER_ID ||
    folderId === NOTES_TRASH_FOLDER_ID
  ) {
    return true
  }

  const categoryId = getCategoryIdFromFolderId(folderId)

  if (categoryId) {
    return categories.some((category) => category.id === categoryId)
  }

  return folders.some((folder) => folder.id === folderId)
}

export function getFolderAncestorIds(
  folders: NoteFolder[],
  folderId: string,
) {
  const folderById = new Map(
    folders.map((folder) => [
      folder.id,
      folder,
    ]),
  )

  const ancestors: string[] = []
  const visitedFolderIds = new Set<string>()
  let currentId: string | null = folderId

  while (currentId) {
    const folder = folderById.get(currentId)

    if (!folder || visitedFolderIds.has(folder.id)) {
      break
    }

    visitedFolderIds.add(folder.id)

    const parentId = folder.parentId ?? NOTES_INBOX_FOLDER_ID

    ancestors.push(parentId)

    if (isSystemFolderId(parentId)) {
      break
    }

    currentId = parentId
  }

  return ancestors
}

export function getFolderDescendantIds(
  folders: NoteFolder[],
  parentFolderId: string,
) {
  const foldersByParentId = new Map<string, NoteFolder[]>()

  folders.forEach((folder) => {
    const parentId = folder.parentId ?? NOTES_INBOX_FOLDER_ID

    foldersByParentId.set(parentId, [
      ...(foldersByParentId.get(parentId) ?? []),
      folder,
    ])
  })

  const descendantIds = new Set<string>()

  function collect(folderId: string) {
    const children = foldersByParentId.get(folderId) ?? []

    children.forEach((child) => {
      if (descendantIds.has(child.id)) {
        return
      }

      descendantIds.add(child.id)
      collect(child.id)
    })
  }

  collect(parentFolderId)

  return descendantIds
}

export function getFolderBranchIds(folders: NoteFolder[], folderId: string) {
  return new Set([
    folderId,
    ...getFolderDescendantIds(folders, folderId),
  ])
}

export function canMoveFolder(
  folders: NoteFolder[],
  folderId: string,
  targetParentId: string,
) {
  if (isSystemFolderId(folderId) || folderId === targetParentId) {
    return false
  }

  return !getFolderDescendantIds(folders, folderId).has(targetParentId)
}

export function isFolderInTrash(
  folders: NoteFolder[],
  folderId: string | null | undefined,
) {
  if (!folderId) {
    return false
  }

  if (folderId === NOTES_TRASH_FOLDER_ID) {
    return true
  }

  const folderById = new Map(
    folders.map((folder) => [
      folder.id,
      folder,
    ]),
  )

  let currentId: string | null = folderId
  const visitedFolderIds = new Set<string>()

  while (currentId && !isSystemFolderId(currentId)) {
    if (visitedFolderIds.has(currentId)) {
      return false
    }

    visitedFolderIds.add(currentId)

    const folder = folderById.get(currentId)

    if (!folder) {
      return false
    }

    if (
      folder.deletedAt ||
      folder.parentId === NOTES_TRASH_FOLDER_ID
    ) {
      return true
    }

    currentId = folder.parentId
  }

  return currentId === NOTES_TRASH_FOLDER_ID
}

export function resolveFolderCategoryId(
  folders: NoteFolder[],
  folderId: string | null,
) {
  const directCategoryId = getCategoryIdFromFolderId(folderId)

  if (directCategoryId) {
    return directCategoryId
  }

  if (
    !folderId ||
    folderId === NOTES_INBOX_FOLDER_ID ||
    folderId === NOTES_TRASH_FOLDER_ID
  ) {
    return null
  }

  const folderById = new Map(
    folders.map((folder) => [
      folder.id,
      folder,
    ]),
  )

  let currentId: string | null = folderId
  const visitedFolderIds = new Set<string>()

  while (currentId && !isSystemFolderId(currentId)) {
    if (visitedFolderIds.has(currentId)) {
      return null
    }

    visitedFolderIds.add(currentId)

    const folder = folderById.get(currentId)

    if (!folder) {
      return null
    }

    const parentCategoryId = getCategoryIdFromFolderId(folder.parentId)

    if (parentCategoryId) {
      return parentCategoryId
    }

    currentId = folder.parentId
  }

  return null
}

export function buildNoteTree(
  categories: Category[],
  folders: NoteFolder[],
  notes: Note[],
): NoteTree {
  const categoryIds = new Set(categories.map((category) => category.id))
  const folderIds = new Set(folders.map((folder) => folder.id))
  const childFoldersByParentId = new Map<string, NoteFolder[]>()
  const notesByFolderId = new Map<string, Note[]>()

  function resolveFolderParentId(folder: NoteFolder) {
    const parentId = folder.parentId ?? NOTES_INBOX_FOLDER_ID
    const parentCategoryId = getCategoryIdFromFolderId(parentId)

    if (
      parentId === NOTES_INBOX_FOLDER_ID ||
      parentId === NOTES_TRASH_FOLDER_ID ||
      folderIds.has(parentId) ||
      (
        parentCategoryId !== null &&
        categoryIds.has(parentCategoryId)
      )
    ) {
      return parentId
    }

    return parentCategoryId ? NOTES_TRASH_FOLDER_ID : NOTES_INBOX_FOLDER_ID
  }

  function resolveNoteFolderId(note: Note) {
    if (note.folderId && isKnownFolderId(categories, folders, note.folderId)) {
      return note.folderId
    }

    if (note.folderId?.startsWith(CATEGORY_FOLDER_PREFIX)) {
      return NOTES_TRASH_FOLDER_ID
    }

    if (note.categoryId && categoryIds.has(note.categoryId)) {
      return getCategoryFolderId(note.categoryId)
    }

    return NOTES_INBOX_FOLDER_ID
  }

  folders.forEach((folder) => {
    const parentId = resolveFolderParentId(folder)

    childFoldersByParentId.set(parentId, [
      ...(childFoldersByParentId.get(parentId) ?? []),
      folder,
    ])
  })

  notes.forEach((note) => {
    const folderId = resolveNoteFolderId(note)

    notesByFolderId.set(folderId, [
      ...(notesByFolderId.get(folderId) ?? []),
      note,
    ])
  })

  function buildStoredFolder(
    folder: NoteFolder,
    visitedFolderIds = new Set<string>(),
  ): NoteTreeFolderNode {
    if (visitedFolderIds.has(folder.id)) {
      return {
        id: folder.id,
        name: folder.name,
        kind: 'folder',
        color: null,
        parentId: folder.parentId,
        folder,
        childFolders: [],
        notes: notesByFolderId.get(folder.id) ?? [],
      }
    }

    const nextVisitedFolderIds = new Set(visitedFolderIds)
    nextVisitedFolderIds.add(folder.id)

    return {
      id: folder.id,
      name: folder.name,
      kind: 'folder',
      color: null,
      parentId: folder.parentId,
      folder,
      childFolders: (childFoldersByParentId.get(folder.id) ?? []).map((child) =>
        buildStoredFolder(child, nextVisitedFolderIds),
      ),
      notes: notesByFolderId.get(folder.id) ?? [],
    }
  }

  const inboxRoot: NoteTreeFolderNode = {
    id: NOTES_INBOX_FOLDER_ID,
    name: 'Inbox',
    kind: 'inbox',
    color: null,
    parentId: null,
    folder: null,
    childFolders: (childFoldersByParentId.get(NOTES_INBOX_FOLDER_ID) ?? []).map(
      (folder) => buildStoredFolder(folder),
    ),
    notes: notesByFolderId.get(NOTES_INBOX_FOLDER_ID) ?? [],
  }

  const categoryRoots = categories.map<NoteTreeFolderNode>((category) => {
    const folderId = getCategoryFolderId(category.id)

    return {
      id: folderId,
      name: category.name,
      kind: 'category',
      color: category.color,
      parentId: null,
      folder: null,
      childFolders: (childFoldersByParentId.get(folderId) ?? []).map((folder) =>
        buildStoredFolder(folder),
      ),
      notes: notesByFolderId.get(folderId) ?? [],
    }
  })

  const trashRoot: NoteTreeFolderNode = {
    id: NOTES_TRASH_FOLDER_ID,
    name: 'Trash',
    kind: 'trash',
    color: null,
    parentId: null,
    folder: null,
    childFolders: (childFoldersByParentId.get(NOTES_TRASH_FOLDER_ID) ?? []).map(
      (folder) => buildStoredFolder(folder),
    ),
    notes: notesByFolderId.get(NOTES_TRASH_FOLDER_ID) ?? [],
  }

  return {
    roots: [
      inboxRoot,
      ...categoryRoots,
    ],
    trash: trashRoot,
  }
}

export function moveCategoryContentsToTrash(
  notes: Note[],
  folders: NoteFolder[],
  categoryId: string,
  deletedAt: string,
) {
  const categoryFolderId = getCategoryFolderId(categoryId)
  const descendantFolderIds = getFolderDescendantIds(folders, categoryFolderId)

  const nextFolders = folders.map((folder) => {
    if (!descendantFolderIds.has(folder.id)) {
      return folder
    }

    return {
      ...folder,
      parentId:
        folder.parentId === categoryFolderId
          ? NOTES_TRASH_FOLDER_ID
          : folder.parentId,
      updatedAt: deletedAt,
      deletedAt: folder.deletedAt ?? deletedAt,
    }
  })

  const nextNotes = notes.map((note) => {
    const isDirectCategoryNote =
      note.folderId === categoryFolderId ||
      (
        note.folderId === null &&
        note.categoryId === categoryId
      )

    if (isDirectCategoryNote) {
      return {
        ...note,
        folderId: NOTES_TRASH_FOLDER_ID,
        categoryId: null,
        updatedAt: deletedAt,
        deletedAt: note.deletedAt ?? deletedAt,
      }
    }

    if (note.folderId && descendantFolderIds.has(note.folderId)) {
      return {
        ...note,
        categoryId: null,
        updatedAt: deletedAt,
        deletedAt: note.deletedAt ?? deletedAt,
      }
    }

    if (note.categoryId === categoryId) {
      return {
        ...note,
        folderId: NOTES_TRASH_FOLDER_ID,
        categoryId: null,
        updatedAt: deletedAt,
        deletedAt: note.deletedAt ?? deletedAt,
      }
    }

    return note
  })

  return {
    notes: nextNotes,
    folders: nextFolders,
  }
}

export function moveFolderBranchToTrash(
  notes: Note[],
  folders: NoteFolder[],
  folderId: string,
  deletedAt: string,
) {
  if (isSystemFolderId(folderId)) {
    return {
      notes,
      folders,
    }
  }

  const movedFolderIds =
    getFolderBranchIds(
      folders,
      folderId,
    )

  const nextFolders = folders.map((folder) =>
    movedFolderIds.has(folder.id)
      ? {
        ...folder,
        parentId:
          folder.id === folderId
            ? NOTES_TRASH_FOLDER_ID
            : folder.parentId,
        updatedAt:
          deletedAt,
        deletedAt:
          folder.deletedAt ?? deletedAt,
      }
      : folder,
  )

  const nextNotes = notes.map((note) =>
    note.folderId && movedFolderIds.has(note.folderId)
      ? {
        ...note,
        categoryId:
          null,
        updatedAt:
          deletedAt,
        deletedAt:
          note.deletedAt ?? deletedAt,
      }
      : note,
  )

  return {
    notes: nextNotes,
    folders: nextFolders,
  }
}

export function emptyTrash(
  notes: Note[],
  folders: NoteFolder[],
) {
  const removedFolderIds = new Set<string>()

  folders.forEach((folder) => {
    if (isFolderInTrash(folders, folder.id)) {
      removedFolderIds.add(folder.id)
    }
  })

  const nextFolders = folders.filter(
    (folder) => !removedFolderIds.has(folder.id),
  )

  const nextNotes = notes.filter((note) => {
    if (note.deletedAt !== null) {
      return false
    }

    if (note.folderId === NOTES_TRASH_FOLDER_ID) {
      return false
    }

    if (note.folderId && removedFolderIds.has(note.folderId)) {
      return false
    }

    return !isFolderInTrash(
      folders,
      note.folderId,
    )
  })

  return {
    notes: nextNotes,
    folders: nextFolders,
  }
}
