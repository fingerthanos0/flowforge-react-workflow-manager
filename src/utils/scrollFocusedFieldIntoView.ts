export function scrollFocusedFieldIntoView(element: HTMLElement) {
  window.setTimeout(() => {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    })
  }, 250)
}
