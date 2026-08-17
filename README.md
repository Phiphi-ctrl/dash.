## Todo

- [x] add a time elapsed hover display to the active ring when hovering over the filled part -- added elapsed field logic and minutes formatter for tasks that go over days
- [x] fix spacing on taskItem -- added p-4 to the outer listitem <li> element
- [x] add checkmark to active and save the completed-at when checking to the task
- [x] move emoji picker to the top of task form to the left of the title so it looks like "🥘Cook"
- [x] add support for multiple active tasks by swiping left on the active task or with a -> button it showing you the other active tasks and keep the shortest in view first
- [x] add deleting templates button to templates plus implied functionality
- [ ] connect details to actual task form in active task
- [x] add calendar render to board.

- Safari 26.x: backdrop-filter popovers may show hover repaint artifacts. This issue does not persist in chrome

# User test simulation

- [x] Add today indicator for the calendar section so the user knows at the first sight what day is today. 
Either mark the day at the top in red or use the surface-hover color to make the entire day row a different color.
- [x] maybe also add a current time indicator and later on we can actually make it so once you open the calendar the current time is already scrolled into view.
- [x] content trimming on tasksegments in calendar f.e. 30 mins seems to have overflowing time.

- [ ] eventually start the settings page where you can set the mode to light mode

# Categories MVP

Goal:
Create a category system that groups tasks into areas of life such as
Household, University, Work, Workout, etc.

A category should have:
- a name
- a color
- related tasks

Tasks should optionally reference one category.

---

## 1. Category data model

- [ ] Create a `Category` type
    - [ ] `id: string`
    - [ ] `name: string`
    - [ ] `color: string`
    - [ ] `createdAt: string`

- [ ] Add `categoryId: string | null` to `Task`

- [ ] Add `categoryId: string | null` to `NewTask`

- [ ] Give new tasks a default `categoryId: null`

- [ ] Make sure older tasks without `categoryId` still work

---

## 2. Category state

- [ ] Add `categories` state to `App.tsx`

- [ ] Load categories from localStorage
    - [ ] Use a key such as `dash.categories`

- [ ] Save categories to localStorage whenever they change

- [ ] Pass `categories` to the Categories page

- [ ] Pass `categories` to `TaskForm`

---

## 3. Basic category operations

- [ ] Create `handleAddCategory()`

- [ ] Create `handleEditCategory()`

- [ ] Create `handleDeleteCategory()`

- [ ] When deleting a category:
    - [ ] Keep its tasks
    - [ ] Set their `categoryId` to `null`

---

## 4. CategoryForm

Create a new simple form inspired by the visual design of `TaskForm`.

- [ ] Create `CategoryForm.tsx`

- [ ] Add category name input

- [ ] Add category color display/button

- [ ] Add color picker

- [ ] Add submit button

- [ ] Add cancel button

- [ ] Support creating a category

- [ ] Support editing an existing category

- [ ] Prevent empty category names

The first version only needs:

    Category Name
    Color
    Save / Cancel

---

## 5. Categories page

- [ ] Render all categories on `/categories`

- [ ] Create a reusable `CategoryCard`

- [ ] Each card should display:
    - [ ] Category color
    - [ ] Category name

- [ ] Add a `+` button for creating categories

- [ ] Clicking `+` opens `CategoryForm`

- [ ] Clicking a category card selects that category

---

## 6. Category details

- [ ] Add state for the currently selected category

- [ ] Open a category details view when a card is clicked

- [ ] Display:
    - [ ] Category name
    - [ ] Category color
    - [ ] Edit button
    - [ ] Delete button

- [ ] Find tasks belonging to the category

- [ ] Display number of related tasks

- [ ] Calculate total scheduled time of related tasks

- [ ] Display total scheduled time

- [ ] Optionally display:
    - [ ] Number of completed tasks
    - [ ] Number of pending tasks
    - [ ] Completed / total ratio

---

## 7. Link tasks to categories

- [ ] Add a Category property to `TaskForm`

- [ ] Create a category picker

- [ ] Display all existing categories in the picker

- [ ] Allow selecting one category

- [ ] Allow selecting "No Category"

- [ ] Store the selected category ID in `newCategoryId`

- [ ] Include `categoryId` in `constructTaskValues()`

- [ ] Make task editing load the existing category

- [ ] Make newly created tasks save their selected category

---

## 8. Connect category colors to tasks

- [ ] Stop treating task color as the primary source of color

- [ ] Find a task's category using `task.categoryId`

- [ ] Read the color from the related category

- [ ] Use the category color for calendar task cards

- [ ] Use the category color in the task details popup

- [ ] Give uncategorized tasks a default color

Conceptually:

    Task
      ↓ categoryId
    Category
      ↓
    color

---

## 9. Category details task list

- [ ] Show related tasks inside the selected category view

- [ ] Sort related tasks by `startAt`

- [ ] Display at least:
    - [ ] Task title
    - [ ] Emoji
    - [ ] Date/time
    - [ ] Completion state

- [ ] Clicking a task should eventually allow editing it
  (optional for first MVP)

---

## 10. MVP cleanup

- [ ] Test creating a category

- [ ] Test editing its name

- [ ] Test changing its color

- [ ] Test deleting it

- [ ] Test assigning a task to a category

- [ ] Test changing a task's category

- [ ] Test removing a category from a task

- [ ] Test that category colors update task cards

- [ ] Test category task count

- [ ] Test category scheduled-time calculation

- [ ] Test reloading the browser and restoring everything from localStorage

---

# Categories MVP Complete When

A user can:

1. Create categories such as Household, University, Work, and Workout.
2. Give each category a name and color.
3. See all categories as cards on the Categories page.
4. Click a category and see its details.
5. See how many tasks belong to that category.
6. See how much time is scheduled for that category.
7. Edit or delete a category.
8. Assign one category to a task from TaskForm.
9. See category colors represented on calendar tasks.
10. Reload the application without losing category data.
  