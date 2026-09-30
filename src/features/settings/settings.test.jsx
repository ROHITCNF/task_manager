// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStores } from '../../../tests/setup/renderWithStores.jsx';
import { QuickCaptureScreen } from '../quick-capture/QuickCaptureScreen.jsx';
import { SettingsScreen } from './SettingsScreen.jsx';

async function renderSignedIn(ui, path) {
  const view = renderWithStores(ui, { path });
  await act(async () => {
    await view.stores.session.getState().signIn();
    await view.stores.workspace.getState().load();
  });
  await act(async () => {});
  return view;
}

describe('US-08 Quick Capture', () => {
  it('disables "Split into tasks" until there is text, then splits', async () => {
    const { services, stores } = await renderSignedIn(<QuickCaptureScreen />, '/quick-capture');
    const button = screen.getByRole('button', { name: 'Split into tasks' });
    expect(button).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Source' })).toHaveDisplayValue('From a meeting');
    expect(screen.getByRole('textbox', { name: 'Notes' }).getAttribute('placeholder')).toBe(
      'Paste meeting notes or a list, one item per line…\n- Follow up with design on mockups\n- Send contract to legal',
    );

    await userEvent.type(screen.getByRole('textbox', { name: 'Notes' }), '   ');
    expect(button).toBeDisabled();
    await userEvent.type(screen.getByRole('textbox', { name: 'Notes' }), 'Call Bounce');
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(services.quickCapture.split).toHaveBeenCalledWith('wsp_1', '   Call Bounce', 'meeting');
    expect(stores.quickCapture.getState().drafts).toEqual([{ title: '   Call Bounce' }]);
  });
});

describe('US-09/10/11 Settings', () => {
  it('shows the current workspace and members with roles', async () => {
    await renderSignedIn(<SettingsScreen />, '/settings');
    expect(screen.getByRole('heading', { level: 1, name: 'Workspace settings' })).toBeInTheDocument();
    expect(screen.getByText('DMT')).toBeInTheDocument();
    const members = screen.getByRole('region', { name: 'Members' });
    expect(members).toHaveTextContent('Neeraj BhattathiripadOWNER');
    expect(members).toHaveTextContent('Anantha Krishnan T GMEMBER');
    expect(screen.getByRole('img', { name: 'Anantha Krishnan T G' })).toHaveAttribute('src', '/a.png');
  });

  it('create: disabled while blank, creates and switches, clears the input', async () => {
    const { stores, services } = await renderSignedIn(<SettingsScreen />, '/settings');
    const button = screen.getByRole('button', { name: 'Create workspace' });
    expect(button).toBeDisabled();
    await userEvent.type(screen.getByRole('textbox', { name: 'Workspace name' }), 'Firmware');
    await userEvent.click(button);
    expect(services.workspaces.create).toHaveBeenCalledWith('Firmware');
    await waitFor(() => expect(stores.workspace.getState().currentId).toBe('wsp_new'));
    expect(screen.getByRole('textbox', { name: 'Workspace name' })).toHaveValue('');
  });

  it('join: enabled even when blank (sends nothing), joins without switching', async () => {
    const { stores, services } = await renderSignedIn(<SettingsScreen />, '/settings');
    const button = screen.getByRole('button', { name: 'Join workspace' });
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(services.workspaces.join).not.toHaveBeenCalled();

    await userEvent.type(screen.getByRole('textbox', { name: 'Invite code' }), 'DEMO-123');
    await userEvent.click(button);
    expect(services.workspaces.join).toHaveBeenCalledWith('DEMO-123');
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Invite code' })).toHaveValue(''));
    expect(stores.workspace.getState().currentId).toBe('wsp_1');
  });
});
