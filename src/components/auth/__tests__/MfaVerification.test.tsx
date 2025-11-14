import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { MfaVerification } from '../MfaVerification'
import { ThemeProvider } from '@contexts/ThemeContext'

const renderComponent = (props?: Partial<React.ComponentProps<typeof MfaVerification>>) =>
  render(
    <MemoryRouter>
      <ThemeProvider>
        <MfaVerification {...props} />
      </ThemeProvider>
    </MemoryRouter>,
  )

describe('MfaVerification', () => {
  it('shows an error when attempting to verify without full code', async () => {
    renderComponent({ codeLength: 4 })
    await userEvent.type(screen.getAllByLabelText(/Digit/i)[0], '1')
    await userEvent.click(screen.getByRole('button', { name: /approve/i }))
    expect(await screen.findByText(/enter all 4 digits/i)).toBeVisible()
  })

  it('calls onVerify with composed code', async () => {
    const handleVerify = vi.fn()
    renderComponent({ codeLength: 3, onVerify: handleVerify })
    const inputs = screen.getAllByLabelText(/Digit/i)
    await userEvent.type(inputs[0], '1')
    await userEvent.type(inputs[1], '2')
    await userEvent.type(inputs[2], '3')
    await userEvent.click(screen.getByRole('button', { name: /approve/i }))
    expect(handleVerify).toHaveBeenCalledWith('123')
  })

  it('enables resend button after timer elapses', async () => {
    vi.useFakeTimers()
    renderComponent({ initialSeconds: 2 })
    const resendButton = screen.getByRole('button', { name: /resend/i })
    expect(resendButton).toBeDisabled()
    await act(async () => {
      vi.advanceTimersByTime(2500)
    })
    expect(resendButton).not.toBeDisabled()
    vi.useRealTimers()
  })
})
