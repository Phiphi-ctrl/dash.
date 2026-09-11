import { createContext, useContext } from 'react'

type ResponsiveContextValue = {
  isMobile: boolean
}

export const ResponsiveContext =
  createContext<ResponsiveContextValue>({
    isMobile: false,
  })

export function useResponsive() {
  return useContext(ResponsiveContext)
}