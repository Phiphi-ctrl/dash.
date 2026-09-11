import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { FileText, Trash2, Upload } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import Tooltip from '../../ui/Tooltip.tsx'
import { deletePdf, loadPdf, savePdf } from '../utils/pdfStorage.ts'

type LoadedPdfState = {
  pdfId: string
  url: string | null
  error: string | null
}

function isPdfFile(file: File) {
  const normalizedType = file.type.toLowerCase()

  return (
    normalizedType === 'application/pdf' ||
    normalizedType === 'application/x-pdf' ||
    file.name.toLowerCase().endsWith('.pdf')
  )
}

function formatFileSize(size: unknown) {
  if (typeof size !== 'number' || !Number.isFinite(size) || size < 0) {
    return null
  }

  if (size === 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']

  const exponent = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1,
  )

  const value = size / 1024 ** exponent

  const formattedValue =
    exponent === 0 ? Math.round(value).toString() : value.toFixed(1)

  return `${formattedValue} ${units[exponent]}`
}

function PdfBlockView({ node, updateAttributes }: NodeViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [loadedPdf, setLoadedPdf] = useState<LoadedPdfState | null>(null)

  const [isSaving, setIsSaving] = useState(false)

  const [isDeleting, setIsDeleting] = useState(false)

  const [uploadError, setUploadError] = useState<string | null>(null)

  const pdfId = typeof node.attrs.pdfId === 'string' ? node.attrs.pdfId : null

  const fileName =
    typeof node.attrs.fileName === 'string' ? node.attrs.fileName : null

  const mimeType =
    typeof node.attrs.mimeType === 'string' ? node.attrs.mimeType : null

  const sizeText = formatFileSize(node.attrs.size)

  const loadedUrl = pdfId && loadedPdf?.pdfId === pdfId ? loadedPdf.url : null

  const loadError = pdfId && loadedPdf?.pdfId === pdfId ? loadedPdf.error : null

  const isLoading = Boolean(pdfId && (!loadedPdf || loadedPdf.pdfId !== pdfId))

  const isBusy = isSaving || isDeleting

  const viewerUrl = loadedUrl
    ? `${loadedUrl}#toolbar=0&navpanes=0&view=FitH`
    : null

  useEffect(() => {
    if (!pdfId) {
      return
    }

    let isCancelled = false

    let objectUrl: string | null = null

    void loadPdf(pdfId)
      .then((storedPdf) => {
        if (isCancelled) {
          return
        }

        if (!storedPdf) {
          setLoadedPdf({
            pdfId,
            url: null,
            error: 'PDF file is missing.',
          })

          return
        }

        objectUrl = URL.createObjectURL(storedPdf.blob)

        setLoadedPdf({
          pdfId,
          url: objectUrl,
          error: null,
        })
      })
      .catch((error: unknown) => {
        console.error('Failed to load PDF:', error)

        if (isCancelled) {
          return
        }

        setLoadedPdf({
          pdfId,
          url: null,
          error: 'PDF could not be loaded.',
        })
      })

    return () => {
      isCancelled = true

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [pdfId])

  function preventEditorMouseDown(event: ReactMouseEvent) {
    event.preventDefault()
    event.stopPropagation()
  }

  function stopEditorEvent(event: ReactMouseEvent | ReactKeyboardEvent) {
    event.stopPropagation()
  }

  function stopToolbarPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.stopPropagation()
  }

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  async function handlePdfFile(file: File) {
    if (!isPdfFile(file)) {
      setUploadError('Choose a PDF file.')

      return
    }

    setIsSaving(true)

    setUploadError(null)

    try {
      const nextPdfId = crypto.randomUUID()

      const previousPdfId = pdfId

      await savePdf(nextPdfId, file, {
        fileName: file.name || null,
        mimeType: file.type || 'application/pdf',
        size: file.size,
      })

      updateAttributes({
        pdfId: nextPdfId,
        fileName: file.name || null,
        mimeType: file.type || 'application/pdf',
        size: file.size,
      })

      if (previousPdfId && previousPdfId !== nextPdfId) {
        void deletePdf(previousPdfId).catch((error: unknown) => {
          console.error('Failed to delete replaced PDF:', error)
        })
      }
    } catch (error) {
      console.error('Failed to save PDF:', error)

      setUploadError('PDF could not be saved.')
    } finally {
      setIsSaving(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    void handlePdfFile(file)
  }

  async function handleDeletePdf() {
    if (!pdfId) {
      return
    }

    setIsDeleting(true)

    setUploadError(null)

    try {
      await deletePdf(pdfId)

      updateAttributes({
        pdfId: null,
        fileName: null,
        mimeType: null,
        size: null,
      })
    } catch (error) {
      console.error('Failed to delete PDF:', error)

      setUploadError('PDF could not be deleted.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <NodeViewWrapper
      className="
        dash-pdf-block
        my-4
      "
    >
      <div contentEditable={false}>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={handleFileInputChange}
        />

        {loadedUrl && viewerUrl ? (
          <>
            <div
              className="
                relative
                h-[calc(100vh-10rem)]
                min-h-[520px]
                w-full
                overflow-hidden
                rounded-3xl
                bg-surface-hover
              "
            >
              <object
                data={viewerUrl}
                type="application/pdf"
                aria-label={fileName ?? 'PDF document'}
                className="
                  h-full
                  w-full
                  bg-canvas
                "
              >
                <div
                  className="
                    flex
                    h-full
                    flex-col
                    items-center
                    justify-center
                    gap-3
                    bg-surface/20
                    px-6
                    text-center
                  "
                >
                  <FileText size={24} className="text-foreground-secondary" />

                  <div className="text-sm font-medium text-foreground">
                    PDF preview is not available here.
                  </div>

                  <a
                    href={loadedUrl}
                    download={fileName ?? 'document.pdf'}
                    onMouseDown={stopEditorEvent}
                    className="
                      text-xs
                      font-medium
                      text-accent
                      transition-colors

                      hover:text-accent-high
                    "
                  >
                    Download PDF
                  </a>
                </div>
              </object>

              <div
                className="
                  group/pdf-toolbar
                  pointer-events-auto
                  absolute
                  inset-x-0
                  top-0
                  z-10
                  h-20
                "
              >
                <div
                  className="
                    pointer-events-none
                    absolute
                    inset-x-0
                    top-2
                    flex
                    px-3
                  "
                >
                  <div
                    onPointerDown={stopToolbarPointerDown}
                    style={{
                      backgroundColor:
                        'color-mix(in oklab, var(--theme-canvas) 52%, transparent)',
                    }}
                    className="
                      glass-surface
                      pointer-events-auto
                      flex
                      min-w-0
                      w-full
                      -translate-y-16
                      transform-gpu
                      items-center
                      justify-between
                      gap-3
                      px-3
                      py-2
                      transition-transform
                      duration-200
                      ease-out
                      will-change-transform

                      group-hover/pdf-toolbar:translate-y-0
                      group-focus-within/pdf-toolbar:translate-y-0
                      motion-reduce:transition-none
                    "
                  >
                    <div className="min-w-0 px-1">
                      <div
                        className="
                          truncate
                          text-sm
                          font-medium
                          text-foreground
                        "
                      >
                        {fileName ?? 'PDF'}
                      </div>

                      <div
                        className="
                          truncate
                          text-xs
                          text-muted
                        "
                      >
                        {sizeText ?? mimeType ?? 'PDF document'}
                      </div>
                    </div>

                    <div
                      className="
                        flex
                        shrink-0
                        items-center
                        gap-1
                      "
                    >
                      <Tooltip
                        content={<span>Replace PDF</span>}
                        delay={300}
                        placement="top"
                      >
                        <button
                          type="button"
                          disabled={isBusy}
                          onMouseDown={preventEditorMouseDown}
                          onClick={openFilePicker}
                          aria-label="Replace PDF"
                          className="
                            flex
                            h-8
                            w-8
                            cursor-pointer
                            items-center
                            justify-center
                            rounded-4xl
                            text-foreground-secondary
                            transition-colors

                            hover:text-foreground
                            disabled:cursor-default
                            disabled:opacity-50
                          "
                        >
                          <Upload size={17} />
                        </button>
                      </Tooltip>

                      <Tooltip
                        content={<span>Remove PDF</span>}
                        delay={300}
                        placement="top"
                      >
                        <button
                          type="button"
                          disabled={isBusy}
                          onMouseDown={preventEditorMouseDown}
                          onClick={() => {
                            void handleDeletePdf()
                          }}
                          aria-label="Remove PDF"
                          className="
                            flex
                            h-8
                            w-8
                            cursor-pointer
                            items-center
                            justify-center
                            rounded-4xl
                            text-foreground-secondary
                            transition-colors

                            hover:text-danger
                            disabled:cursor-default
                            disabled:opacity-50
                          "
                        >
                          <Trash2 size={17} />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {uploadError && (
              <div
                className="
                  mt-2
                  px-1
                  text-xs
                  text-danger
                "
              >
                {uploadError}
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            disabled={isBusy}
            onMouseDown={preventEditorMouseDown}
            onClick={openFilePicker}
            className="
              flex
              h-40
              w-full
              cursor-pointer
              flex-col
              items-center
              justify-center
              gap-3
              rounded-3xl
              border
              border-dashed
              border-border
              bg-surface/20
              px-4
              py-8
              text-center
              transition-colors
              md:h-48

              hover:border-accent/60
              hover:bg-surface-hover/40
              disabled:cursor-default
              disabled:opacity-60
            "
          >
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-md
                bg-surface-hover
                text-foreground-secondary
              "
            >
              <FileText size={18} />
            </div>

            <span
              className="
                text-sm
                font-medium
                text-foreground
              "
            >
              {isSaving
                ? 'Saving PDF...'
                : isLoading
                  ? 'Loading PDF...'
                  : 'Choose PDF file'}
            </span>

            <span
              className="
                text-xs
                text-muted
              "
            >
              {loadError ?? uploadError ?? 'PDF documents only'}
            </span>
          </button>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export default PdfBlockView
