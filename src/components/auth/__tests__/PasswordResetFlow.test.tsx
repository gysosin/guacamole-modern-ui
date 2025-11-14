import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ThemeProvider } from '@contexts/ThemeContext'
import { PasswordResetFlow } from '../PasswordResetFlow'

const renderFlow = (props?: Partial<React.ComponentProps<typeof PasswordResetFlow>>) =>
  render(
    <ThemeProvider>
      <PasswordResetFlow {...props} />
    </ThemeProvider>,
  )

describe('PasswordResetFlow', () => {
  it('requires account email on first step', async () => {
    renderFlow()
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(await screen.findByText(/enter the email/i)).toBeVisible()
  })

  it('advances to challenge step after successful email submission', async () => {
    const requestChallenge = vi.fn()
    renderFlow({ onRequestChallenge: requestChallenge })
    await userEvent.type(screen.getByLabelText(/account email/i), 'operator@acme.co')
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(requestChallenge).toHaveBeenCalledWith('operator@acme.co')
    })
    expect(await screen.findByLabelText(/6-digit verification code/i)).toBeInTheDocument()
  })

  it('validates matching passwords on final step', async () => {
    renderFlow({
      onRequestChallenge: vi.fn(),
      onVerifyChallenge: vi.fn(),
    })

    await userEvent.type(screen.getByLabelText(/account email/i), 'operator@acme.co')
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    await waitFor(() =>
      expect(screen.getByLabelText(/6-digit verification code/i)).toBeInTheDocument(),
    )

    await userEvent.type(screen.getByLabelText(/6-digit verification code/i), '123456')
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    await waitFor(() => expect(screen.getByLabelText(/new password/i)).toBeInTheDocument())

    await userEvent.type(screen.getByLabelText(/new password/i), 'VerySecure123!')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Mismatch!')
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }))
    expect(await screen.findByText(/passwords must match/i)).toBeVisible()
  })
})
