import { useEffect, useRef, useState } from 'react'
import SubmitButton from '../../ui/SubmitButton.tsx'
import CancelButton from '../../ui/CancelButton.tsx'
import {
  Palette,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import * as React from 'react'
import ColorPicker from '../TaskForm/ColorPicker/ColorPicker.tsx'
import type { NewCategory } from '../../../types/Category.ts'

type CategoryFormProps = {
  initialValues: NewCategory
  onClose: () => void
  onSubmit: (values: NewCategory) => void
}

function CategoryForm ({initialValues, onClose, onSubmit }: CategoryFormProps) {
  const [newName, setNewName] = useState(initialValues.name)
  const [newColor, setNewColor] = useState<string>(initialValues.color)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)

  const [colorPopoverPosition, setColorPopoverPosition] =
    useState<PopoverPosition | null>(null)
  const colorAnchorRef =
    useRef<HTMLDivElement>(null)
  const colorPopoverRef =
    useRef<HTMLDivElement>(null)

  useEffect(() => {
    if(!isColorPickerOpen) {
      return
    }

    function handleDocumentClickCP(event: MouseEvent) {
      if(!(event.target instanceof Node)) {
        return
      }

      const clickedAnchor =
        colorAnchorRef.current?.contains(event.target)

      const clickedPopover =
        colorPopoverRef.current?.contains(event.target)

      if (!clickedAnchor && !clickedPopover) {

        setIsColorPickerOpen(false)
      }
    }

    document.addEventListener('click', handleDocumentClickCP)

    return () => {
      document.removeEventListener('click', handleDocumentClickCP)
    }
  }, [isColorPickerOpen])

  function handleColorPickerToggle () {
    if(isColorPickerOpen) {
      setIsColorPickerOpen(false)
      return
    }
    if(!isColorPickerOpen) {
      const rect =
        colorAnchorRef.current?.getBoundingClientRect()

      if (rect === undefined) {
        return
      }

      setColorPopoverPosition({
        left: rect.left,
        top: rect.bottom + 10,
      })

      setIsColorPickerOpen(true)
    }
    return
  }

  function handleColorSelect (color: string) {
    setNewColor(color)
    setIsColorPickerOpen(false)
  }


  function constructCategoryValues(): NewCategory {
    return {
      name: newName,
      color: newColor,
    }
  }

  return (
    <form
      className="flex flex-col gap-15 p-12 will-change-contents"
      onSubmit={(event) => {
        event.preventDefault()
        const values = constructCategoryValues()
        onSubmit(values)
      }}
    >

      {/*Top: Title and Cancel/Add button*/}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-end ml-auto text-foreground">
          <div className="flex-1 max-w-xs">

          </div>
          <div className="flex-1 max-w-xs">
            <SubmitButton />
          </div>
          <div className="flex-1 max-w-xs">
            <CancelButton onCancel={onClose} />
          </div>
        </div>
        {/*Icon and title*/}
        <div className="flex items-center justify-end gap-4">
          <input
            type="text"
            value={newName}
            onChange={(event) => {
              setNewName(event.target.value)
            }}
            placeholder="New Category . . ."
            className={`w-full truncate rounded-lg bg-app-surface text-3xl font-bold focus:outline-none 
          ${newName.trim() === '' ? 'text-muted' : 'text-foreground'}`}
          />
        </div>
      </div>

      {/*Main Property List*/}
      <div className="grid grid-cols-2 gap-4">

        {/*Color*/}
        <div className="flex text-foreground">
          <div className="grid size-8 place-items-center">
            <Palette className="size-4"/>
          </div>
          <span className="p-1">
          Color
          </span>
        </div>
        <div className="flex items-center relative -ml-20">
          <div ref={colorAnchorRef}>
            <button
              type="button"
              onClick={handleColorPickerToggle}
              className="text-foreground-secondary cursor-pointer"
            >
              <div
                style={{
                  '--task-color-taskform': newColor,
                } as React.CSSProperties}
                className="inline-block bg-[var(--task-color-taskform)] rounded-full size-4"
              />
            </button>

            {isColorPickerOpen && colorPopoverPosition !== null && createPortal(
              <div
                ref={colorPopoverRef}
                className="
                fixed
                z-[100]
                p-4
                "
                style={{
                  top: colorPopoverPosition.top,
                  left: colorPopoverPosition.left,
                }}
              >
                <div className="glass-panel-bg"/>
                <div className="relative z-10">
                  <ColorPicker onClick={handleColorSelect} />
                </div>
              </div>,

              document.body
            )}
          </div>
        </div>
      </div>

    </form>
  )
}

export default CategoryForm;