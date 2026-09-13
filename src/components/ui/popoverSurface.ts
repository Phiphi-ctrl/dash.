export const popoverArrowWidth = 18
export const popoverSurfacePadding = 12

export type PopoverSurface = {
  width: number
  height: number
  cornerRadius: number
  arrowX?: number
  arrowY?: number
}

function getSurfaceMetrics({ width, height, cornerRadius, arrowX, arrowY }: PopoverSurface, side: string) {
  const horizontal = side === 'left' || side === 'right'
  const edge = horizontal ? height : width
  const cross = horizontal ? width : height
  const half = Math.min(popoverArrowWidth / 2, Math.max(0, (edge - 1) / 4))
  const shoulder = Math.min(4, Math.max(0, (edge - 1) / 8))
  const radius = Math.max(0, Math.min(
    cornerRadius,
    (cross - 1) / 2,
    (edge - 1) / 2 - half - shoulder,
  ))

  const margin = 0.5 + radius + half + shoulder
  return {
    half, shoulder, radius,
    depth: Math.min(9, half),
    tip: Math.min(2, half / 2),
    centerX: Math.max(margin, Math.min(width - margin, (arrowX ?? 0) + popoverArrowWidth / 2)),
    centerY: Math.max(margin, Math.min(height - margin, (arrowY ?? 0) + popoverArrowWidth / 2)),
  }
}

export function getPopoverArrowPadding(width: number, height: number, cornerRadius: number, side = 'bottom') {
  const { radius, shoulder } = getSurfaceMetrics({ width, height, cornerRadius }, side)
  return radius + shoulder + 1
}

export function getPopoverSurfaceOrigin(surface: PopoverSurface, side: string) {
  const { centerX, centerY, depth, tip } = getSurfaceMetrics(surface, side)
  // The rounded tip's outermost point is halfway along its quadratic curve.
  const tipOffset = 0.5 - depth + tip / 2
  return {
    x: side === 'left' ? surface.width - tipOffset : side === 'right' ? tipOffset : centerX,
    y: side === 'top' ? surface.height - tipOffset : side === 'bottom' ? tipOffset : centerY,
  }
}

export function getPopoverSurfacePath(
  surface: PopoverSurface,
  side: string,
  scale = 1,
): string {
  const { width, height } = surface
  const metrics = getSurfaceMetrics(surface, side)
  const padding = popoverSurfacePadding
  const { x: originX, y: originY } = getPopoverSurfaceOrigin(surface, side)
  const x = (value: number) => padding + originX + (value - originX) * scale
  const y = (value: number) => padding + originY + (value - originY) * scale
  const left = x(0.5)
  const top = y(0.5)
  const right = x(width - 0.5)
  const bottom = y(height - 0.5)
  const radius = metrics.radius * scale
  const half = metrics.half * scale
  const depth = metrics.depth * scale
  const tip = metrics.tip * scale
  const shoulder = metrics.shoulder * scale
  const slope = shoulder / 2
  const centerX = x(metrics.centerX)
  const centerY = y(metrics.centerY)

  // Scale path coordinates, not the backdrop layer. The outline uses the full-size path.
  return [
    `M ${left + radius} ${top}`,
    side === 'bottom'
      ? `H ${centerX - half - shoulder} Q ${centerX - half} ${top} ${centerX - half + slope} ${top - slope} L ${centerX - tip} ${top - depth + tip} Q ${centerX} ${top - depth} ${centerX + tip} ${top - depth + tip} L ${centerX + half - slope} ${top - slope} Q ${centerX + half} ${top} ${centerX + half + shoulder} ${top}`
      : '',
    `H ${right - radius} A ${radius} ${radius} 0 0 1 ${right} ${top + radius}`,
    side === 'left'
      ? `V ${centerY - half - shoulder} Q ${right} ${centerY - half} ${right + slope} ${centerY - half + slope} L ${right + depth - tip} ${centerY - tip} Q ${right + depth} ${centerY} ${right + depth - tip} ${centerY + tip} L ${right + slope} ${centerY + half - slope} Q ${right} ${centerY + half} ${right} ${centerY + half + shoulder}`
      : '',
    `V ${bottom - radius} A ${radius} ${radius} 0 0 1 ${right - radius} ${bottom}`,
    side === 'top'
      ? `H ${centerX + half + shoulder} Q ${centerX + half} ${bottom} ${centerX + half - slope} ${bottom + slope} L ${centerX + tip} ${bottom + depth - tip} Q ${centerX} ${bottom + depth} ${centerX - tip} ${bottom + depth - tip} L ${centerX - half + slope} ${bottom + slope} Q ${centerX - half} ${bottom} ${centerX - half - shoulder} ${bottom}`
      : '',
    `H ${left + radius} A ${radius} ${radius} 0 0 1 ${left} ${bottom - radius}`,
    side === 'right'
      ? `V ${centerY + half + shoulder} Q ${left} ${centerY + half} ${left - slope} ${centerY + half - slope} L ${left - depth + tip} ${centerY + tip} Q ${left - depth} ${centerY} ${left - depth + tip} ${centerY - tip} L ${left - slope} ${centerY - half + slope} Q ${left} ${centerY - half} ${left} ${centerY - half - shoulder}`
      : '',
    `V ${top + radius} A ${radius} ${radius} 0 0 1 ${left + radius} ${top} Z`,
  ].join(' ')
}
