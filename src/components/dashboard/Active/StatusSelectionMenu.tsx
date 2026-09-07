import {Clock2, Hash, type LucideIcon} from 'lucide-react'
import type {ActiveStatus} from "./ActiveTask.tsx";

type LabelOption = ActiveStatus

type SelectionOption = {
    label: LabelOption
    Icon: LucideIcon
}

type StatusSelectionMenuProps = {
    onSelect: (selection: ActiveStatus) => void
}




function StatusSelectionMenu({onSelect}: StatusSelectionMenuProps) {
    const selectionOptions: SelectionOption[] = [
        {
            label: "Time",
            Icon: Clock2,
        },
        {
            label: "Completed",
            Icon: Hash,
        },
    ]

    return (
        <div className="flex flex-col gap-4 text-xs text-foreground-secondary">
            {selectionOptions.map((option, index) => (
                <button key={index} onClick={() => onSelect(option.label)} className="flex gap-2 hover:scale-110 hover:text-foreground transition-transform">
                    <option.Icon size={14}/>
                    {option.label}
                </button>
            ))}
        </div>
    )
}

export default StatusSelectionMenu