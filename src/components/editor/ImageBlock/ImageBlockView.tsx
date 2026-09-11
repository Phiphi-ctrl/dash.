import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'

import { Image as ImageIcon, Trash2, Upload } from 'lucide-react'

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
import { deleteImage, loadImage, saveImage } from '../utils/imageStorage.ts'

type LoadedImageState = {
  imageId: string
  url: string | null
  error: string | null
}

type BannerDragState = {
  pointerId: number
  startClientY: number
  startObjectPositionY: number
  currentObjectPositionY: number
}

const DEFAULT_OBJECT_POSITION_Y = 0.5

function clampObjectPositionY(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_OBJECT_POSITION_Y
  }

  return Math.min(1, Math.max(0, value))
}

function getImageDimensions(file: File) {
  return new Promise<{
    width: number
    height: number
  }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)

    const image = new window.Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)

      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)

      reject(new Error('Unable to read image dimensions.'))
    }

    image.src = objectUrl
  })
}

function formatImageDimensions(width: unknown, height: unknown) {
  if (
    typeof width !== 'number' ||
    typeof height !== 'number' ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
  ) {
    return null
  }

  return `${Math.round(width)} x ${Math.round(height)}`
}

function ImageBlockView({ node, updateAttributes }: NodeViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const bannerDragRef = useRef<BannerDragState | null>(null)

  const [loadedImage, setLoadedImage] = useState<LoadedImageState | null>(null)

  const [isSaving, setIsSaving] = useState(false)

  const [isDeleting, setIsDeleting] = useState(false)

  const [uploadError, setUploadError] = useState<string | null>(null)

  const [draftObjectPositionY, setDraftObjectPositionY] = useState<
    number | null
  >(null)

  const [isRepositioning, setIsRepositioning] = useState(false)

  const imageId =
    typeof node.attrs.imageId === 'string' ? node.attrs.imageId : null

  const fileName =
    typeof node.attrs.fileName === 'string' ? node.attrs.fileName : null

  const mimeType =
    typeof node.attrs.mimeType === 'string' ? node.attrs.mimeType : null

  const objectPositionY = clampObjectPositionY(
    typeof node.attrs.objectPositionY === 'number'
      ? node.attrs.objectPositionY
      : DEFAULT_OBJECT_POSITION_Y,
  )

  const visibleObjectPositionY = draftObjectPositionY ?? objectPositionY

  const objectPositionPercent = Math.round(visibleObjectPositionY * 100)

  const alt = typeof node.attrs.alt === 'string' ? node.attrs.alt : ''

  const dimensionsText = formatImageDimensions(
    node.attrs.width,
    node.attrs.height,
  )

  const loadedUrl =
    imageId && loadedImage?.imageId === imageId ? loadedImage.url : null

  const loadError =
    imageId && loadedImage?.imageId === imageId ? loadedImage.error : null

  const isBusy = isSaving || isDeleting

  useEffect(() => {
    if (!imageId) {
      return
    }

    let isCancelled = false

    let objectUrl: string | null = null

    void loadImage(imageId)
      .then((storedImage) => {
        if (isCancelled) {
          return
        }

        if (!storedImage) {
          setLoadedImage({
            imageId,
            url: null,
            error: 'Banner image file is missing.',
          })

          return
        }

        objectUrl = URL.createObjectURL(storedImage.blob)

        setLoadedImage({
          imageId,
          url: objectUrl,
          error: null,
        })
      })
      .catch((error: unknown) => {
        console.error('Failed to load banner image:', error)

        if (isCancelled) {
          return
        }

        setLoadedImage({
          imageId,
          url: null,
          error: 'Banner image could not be loaded.',
        })
      })

    return () => {
      isCancelled = true

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [imageId])

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

  async function handleImageFile(file: File) {
    if (file.type && !file.type.startsWith('image/')) {
      setUploadError('Choose an image file.')

      return
    }

    setIsSaving(true)

    setUploadError(null)

    try {
      const dimensions = await getImageDimensions(file)

      const nextImageId = crypto.randomUUID()

      const previousImageId = imageId

      await saveImage(nextImageId, file, {
        fileName: file.name || null,
        mimeType: file.type || null,
        width: dimensions.width,
        height: dimensions.height,
      })

      updateAttributes({
        imageId: nextImageId,
        fileName: file.name || null,
        mimeType: file.type || null,
        width: dimensions.width,
        height: dimensions.height,
        objectPositionY: DEFAULT_OBJECT_POSITION_Y,
      })

      if (previousImageId && previousImageId !== nextImageId) {
        void deleteImage(previousImageId).catch((error: unknown) => {
          console.error('Failed to delete replaced banner image:', error)
        })
      }
    } catch (error) {
      console.error('Failed to save banner image:', error)

      setUploadError('Banner image could not be saved.')
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

    void handleImageFile(file)
  }

  async function handleDeleteImage() {
    if (!imageId) {
      return
    }

    setIsDeleting(true)

    setUploadError(null)

    try {
      await deleteImage(imageId)

      updateAttributes({
        imageId: null,
        fileName: null,
        mimeType: null,
        width: null,
        height: null,
        alt: null,
        objectPositionY: DEFAULT_OBJECT_POSITION_Y,
      })
    } catch (error) {
      console.error('Failed to delete banner image:', error)

      setUploadError('Banner image could not be deleted.')
    } finally {
      setIsDeleting(false)
    }
  }

  function handleAltChange(event: ChangeEvent<HTMLInputElement>) {
    updateAttributes({
      alt: event.target.value || null,
    })
  }

  function handleBannerPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!loadedUrl || isBusy) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    bannerDragRef.current = {
      pointerId: event.pointerId,
      startClientY: event.clientY,
      startObjectPositionY: visibleObjectPositionY,
      currentObjectPositionY: visibleObjectPositionY,
    }

    setIsRepositioning(true)

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleBannerPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = bannerDragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const rect = event.currentTarget.getBoundingClientRect()

    const deltaY = event.clientY - drag.startClientY

    const nextObjectPositionY = clampObjectPositionY(
      drag.startObjectPositionY - deltaY / Math.max(rect.height, 1),
    )

    drag.currentObjectPositionY = nextObjectPositionY

    setDraftObjectPositionY(nextObjectPositionY)
  }

  function finishBannerDrag(
    event: ReactPointerEvent<HTMLDivElement>,
    shouldCommit: boolean,
  ) {
    const drag = bannerDragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const nextObjectPositionY = drag.currentObjectPositionY

    bannerDragRef.current = null

    setIsRepositioning(false)

    setDraftObjectPositionY(null)

    if (!shouldCommit) {
      return
    }

    updateAttributes({
      objectPositionY: nextObjectPositionY,
    })
  }

  return (
    <NodeViewWrapper
      className="
            dash-image-block
            my-4
          "
    >
      <div
        contentEditable={false}
        className="
              group/banner
            "
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileInputChange}
        />

        {loadedUrl ? (
          <>
            <div
              onPointerDown={handleBannerPointerDown}
              onPointerMove={handleBannerPointerMove}
              onPointerUp={(event) => {
                finishBannerDrag(event, true)
              }}
              onPointerCancel={(event) => {
                finishBannerDrag(event, false)
              }}
              className={`
                      relative
                      h-40
                      w-full
                      overflow-hidden
                      rounded-3xl
                      bg-surface-hover
                      md:h-48

                      ${isRepositioning ? 'cursor-grabbing' : 'cursor-grab'}
                    `}
            >
              <img
                src={loadedUrl}
                alt={alt}
                draggable={false}
                style={{
                  objectPosition: `center ${objectPositionPercent}%`,
                }}
                className="
                        h-full
                        w-full
                        select-none
                        object-cover
                      "
              />

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
	                    items-center
		                    justify-between
		                    gap-3
		                    px-3
		                    py-2
		                    -translate-y-16
		                    transform-gpu
		                    transition-transform
		                    duration-200
		                    ease-out
		                    will-change-transform

		                    group-hover/banner:translate-y-0
		                    group-focus-within/banner:translate-y-0
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
                      {fileName ?? 'Banner'}
                    </div>

                    <div
                      className="
	                        truncate
	                        text-xs
	                        text-muted
	                      "
                    >
                      {dimensionsText ?? mimeType ?? 'Cover image'}
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
                      content={<span>Replace banner</span>}
                      delay={300}
                      placement="top"
                    >
                      <button
                        type="button"
                        disabled={isBusy}
                        onMouseDown={preventEditorMouseDown}
                        onClick={openFilePicker}
                        aria-label="Replace banner"
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
                      content={<span>Remove banner</span>}
                      delay={300}
                      placement="top"
                    >
                      <button
                        type="button"
                        disabled={isBusy}
                        onMouseDown={preventEditorMouseDown}
                        onClick={() => {
                          void handleDeleteImage()
                        }}
                        aria-label="Remove banner"
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

            <input
              type="text"
              value={alt}
              onChange={handleAltChange}
              onMouseDown={stopEditorEvent}
              onKeyDown={stopEditorEvent}
              placeholder="Add alt text"
              aria-label="Banner alt text"
              className="
                      mt-2
                      w-full
                      bg-transparent
                      px-1
                      text-xs
                      text-muted
                      outline-none
                      transition-colors

                      placeholder:text-muted/60
                      focus:text-foreground-secondary
                    "
            />
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
              <ImageIcon size={18} />
            </div>

            <span
              className="
                      text-sm
                      font-medium
                      text-foreground
                    "
            >
              {isSaving ? 'Saving banner...' : 'Choose banner image'}
            </span>

            <span
              className="
                      text-xs
                      text-muted
                    "
            >
              {loadError ?? uploadError ?? 'PNG, JPEG, GIF, SVG, or WebP'}
            </span>
          </button>
        )}

        {loadedUrl && uploadError && (
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
      </div>
    </NodeViewWrapper>
  )
}

export default ImageBlockView
