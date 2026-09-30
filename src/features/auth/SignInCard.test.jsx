// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStores } from '../../../tests/setup/renderWithStores.jsx';
import { SignInCard } from './SignInCard.jsx';

describe('US-01 SignInCard', () => {
  it('shows the reference copy with a single Google button and no icon', () => {
    renderWithStores(<SignInCard />, { path: '/login' });
    expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText('Team action items, all in one place.')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent(/^Continue with Google$/);
    expect(buttons[0].querySelector('svg, img')).toBeNull();
  });

  it('signs in through the session store', async () => {
    const { stores, services } = renderWithStores(<SignInCard />, { path: '/login' });
    await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));
    expect(services.auth.signIn).toHaveBeenCalledTimes(1);
    expect(stores.session.getState().phase).toBe('signedIn');
  });
});
