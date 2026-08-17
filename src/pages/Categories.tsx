import LiveDateTime from '../components/dashboard/LiveDateTime.tsx'
import { LayoutDashboard, ListSortDescending, PlusIcon } from 'lucide-react'
import type { Category } from '../types/Category.ts'
import CategoryCard from '../components/categories/CategoryCard.tsx'
import Button from '../components/ui/Button.tsx'

type CategoriesProps = {
  categories: Category[]
  handleDeleteCategory: (id: string) => void
  setIsAddCategoryOpen: (isOpen: boolean) => void
}

function Categories( { categories, setIsAddCategoryOpen, handleDeleteCategory }: CategoriesProps ) {
  return (
    <main className="flex flex-1 z-0 flex-col px-10 gap-8">
      <header className="flex gap-1 items-center justify-between">
        <LiveDateTime />
        <div className="flex gap-1 text-foreground-secondary">
          <LayoutDashboard />
          <span>categories.</span>
        </div>
      </header>
      <section className="flex flex-col gap-1">
        <div className="flex justify-between mb-4 p-2">
          <div className="flex justify-center items-center p-2 gap-3 text-foreground">
            <ListSortDescending className="size-5" />
            <h3 className="text-xl font-semibold">Active Categories.</h3>
          </div>
          <Button
            onClick={() => {
              setIsAddCategoryOpen(true)
            }}
            Icon={PlusIcon}
            className={`
              bg-app-surface 
              border-border 
              text-muted 
              hover:bg-accent-soft
              hover:border-accent
              hover:text-accent
            `}
          />
        </div>
        <div className="flex flex-wrap gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} handleDeleteCategory={handleDeleteCategory} />
          ))}
        </div>

      </section>
    </main>
  )
}

export default Categories