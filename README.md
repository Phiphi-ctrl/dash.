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

- [ ] Add today indicator for the calendar section so the user knows at the first sight what day is today. 
Either mark the day at the top in red or use the surface-hover color to make the entire day row a different color.
- [ ] maybe also add a current time indicator and later on we can actually make it so once you open the calendar the current time is already scrolled into view.
- [ ] content trimming on tasksegments in calendar f.e. 30 mins seems to have overflowing time.
- [ ] eventually start the settings page where you can set the mode to light mode
  