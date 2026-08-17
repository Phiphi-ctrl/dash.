import type { Category } from '../../types/Category.ts'
import { Pen, Trash2 } from 'lucide-react'
import * as React from 'react'

type CategoryCardProps = {
  category: Category
  handleDeleteCategory: (id: string) => void
}

function CategoryCard ( { category, handleDeleteCategory }: CategoryCardProps ) {
  return (
    <div className="flex h-60 w-60 text-foreground-secondary p-4 glass-surface hover:-translate-y-1/12 transition-transform duration-200">
      <div className="flex w-full flex-col gap-6">
        <div className="flex items-center justify-end gap-4">
          <button
          >
            <Pen className="size-4"/>
          </button>
          <button
            className="cursor-pointer"
            onClick={() => handleDeleteCategory(category.id)}
          >
            <Trash2 className="size-4"/>
          </button>
        </div>
        <div
          className="flex items-center gap-4"
          style={{
            '--category-color': category.color,
          } as React.CSSProperties}
        >
          <span className="inline-flex size-4 rounded-full bg-[var(--category-color)]" />
          <span className="text-foreground font-semibold">{category.name}</span>
        </div>
      </div>
    </div>
  )
}

export default CategoryCard;