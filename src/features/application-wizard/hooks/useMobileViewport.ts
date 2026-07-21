import { useEffect } from 'react'

export function useMobileViewport() {
  useEffect(() => {
    const viewport = window.visualViewport

    const updateViewportHeight = () => {
      const height = viewport?.height ?? window.innerHeight
      document.documentElement.style.setProperty('--visual-viewport-height', `${height}px`)
    }

    updateViewportHeight()

    viewport?.addEventListener('resize', updateViewportHeight)
    viewport?.addEventListener('scroll', updateViewportHeight)
    window.addEventListener('resize', updateViewportHeight)

    return () => {
      viewport?.removeEventListener('resize', updateViewportHeight)
      viewport?.removeEventListener('scroll', updateViewportHeight)
      window.removeEventListener('resize', updateViewportHeight)
    }
  }, [])
}
