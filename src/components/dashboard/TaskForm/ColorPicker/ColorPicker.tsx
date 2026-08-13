import * as React from "react";

type ColorPickerProps = {
    onClick: (color: string) => void;
}



function ColorPicker({onClick}: ColorPickerProps) {

    const colorArray = [
        '#13070C',
        '#C4C4C4',
        '#36374d',
        '#7F9183',
    ]
    return (
        <div className="p-2 grid grid-cols-4">
            {colorArray.map((color) => (
                <div key={color} className="p-1">
                    <button
                        onClick={() => onClick(color)}
                        style={{
                            '--task-color-taskform': color,
                        } as React.CSSProperties}
                        className="inline-block bg-[var(--task-color-taskform)] rounded-full size-4"
                    />
                </div>

            ))}
        </div>
    )
}

export default ColorPicker;