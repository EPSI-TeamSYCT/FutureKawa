import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/theme-context'
import './ThemeToggle.css'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? 'Passer au thème clair' : 'Passer au thème sombre'

  return (
    <button
      type="button"
      className="fk-theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {isDark ? (
        <Sun size={18} strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <Moon size={18} strokeWidth={1.75} aria-hidden="true" />
      )}
    </button>
  )
}
