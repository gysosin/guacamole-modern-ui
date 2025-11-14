import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from '@contexts/ThemeContext'

describe('App shell', () => {
  it('renders the brand shell and navigation', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText(/Guacamole Modern/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Switch to/i })).toBeInTheDocument()
  })
})
