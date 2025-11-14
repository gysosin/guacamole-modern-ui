import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { LoginForm } from '../LoginForm'
import { ThemeProvider } from '@contexts/ThemeContext'

const renderLoginForm = (props?: Partial<React.ComponentProps<typeof LoginForm>>) =>
  render(
    <MemoryRouter>
      <ThemeProvider>
        <LoginForm {...props} />
      </ThemeProvider>
    </MemoryRouter>,
  )

describe('LoginForm', () => {
  it('shows inline validation when submitting empty form', async () => {
    renderLoginForm()
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/enter the email/i)).toBeVisible()
    expect(screen.getByText(/enter your password/i)).toBeVisible()
  })

  it('calls onSubmit with provided values when valid', async () => {
    const handleSubmit = vi.fn()
    renderLoginForm({ onSubmit: handleSubmit })

    await userEvent.type(screen.getByLabelText(/work email/i), 'operator@guac.dev')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Str0ngPass!')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'operator@guac.dev',
      password: 'Str0ngPass!',
      rememberDevice: true,
    })
  })
})
