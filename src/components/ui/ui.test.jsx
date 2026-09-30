// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Button, IconButton, Input, Textarea, Select, SegmentedControl, Card, Dot, Pill, Avatar, AvatarGroup, BarMeter, ScrollArea, EmptyText, SunIcon,
} from './index.js';

describe('Button', () => {
  it('renders a native type=button and fires clicks', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>+ New task</Button>);
    const button = screen.getByRole('button', { name: '+ New task' });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled (Split into tasks / Create workspace)', async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Split into tasks</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it.each(['primary', 'secondary', 'ghost'])('applies the %s variant class', (variant) => {
    render(<Button variant={variant} fullWidth>x</Button>);
    expect(screen.getByRole('button').className).toMatch(new RegExp(variant));
    expect(screen.getByRole('button').className).toMatch(/fullWidth/);
  });
});

describe('fields', () => {
  it('Input, Textarea and IconButton expose accessible names', () => {
    render(
      <>
        <Input placeholder="Search tasks…" aria-label="Search tasks" size="sm" />
        <Textarea aria-label="Notes" placeholder={'Paste meeting notes\n- item'} />
        <IconButton label="Previous month">‹</IconButton>
      </>,
    );
    expect(screen.getByRole('textbox', { name: 'Search tasks' })).toHaveAttribute('placeholder', 'Search tasks…');
    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeInTheDocument();
  });

  it('Select renders native options and reports changes', async () => {
    const onChange = vi.fn();
    render(<Select aria-label="Assignee" value="" onChange={onChange} options={[{ value: '', label: 'Everyone' }, { value: 'u1', label: 'Neeraj' }]} />);
    const select = screen.getByRole('combobox', { name: 'Assignee' });
    expect(select).toHaveDisplayValue('Everyone');
    await userEvent.selectOptions(select, 'u1');
    expect(onChange).toHaveBeenCalled();
  });
});

describe('SegmentedControl', () => {
  it('is a radio group with one checked option', async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        label="Theme"
        value="light"
        onChange={onChange}
        options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light', icon: <SunIcon /> }, { value: 'dark', label: 'Dark' }]}
      />,
    );
    expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(onChange).toHaveBeenCalledWith('dark');
  });
});

describe('display', () => {
  it('Pill passes its colour to the dot and the tint', () => {
    const { container } = render(<Pill tone="tinted" colour="#ca3a32">Bounce</Pill>);
    const pill = container.firstChild;
    expect(pill).toHaveTextContent('Bounce');
    expect(pill.style.getPropertyValue('--pill-colour')).toBe('#ca3a32');
    expect(pill.className).toMatch(/tinted/);
    expect(pill.firstChild.style.getPropertyValue('--dot-colour')).toBe('#ca3a32');
  });

  it('Avatar renders photo, initial, and unassigned variants', () => {
    render(
      <AvatarGroup>
        <Avatar src="/a.png" alt="Anantha Krishnan T G" />
        <Avatar initial="B" alt="Bommidi" colour="var(--color-avatar-9)" />
        <Avatar unassigned />
      </AvatarGroup>,
    );
    expect(screen.getByRole('img', { name: 'Anantha Krishnan T G' })).toHaveAttribute('src', '/a.png');
    expect(screen.getByRole('img', { name: 'Bommidi' })).toHaveTextContent('B');
    expect(screen.getByRole('img', { name: 'Bommidi' }).style.getPropertyValue('--avatar-bg')).toBe('var(--color-avatar-9)');
    expect(screen.getByRole('img', { name: 'Unassigned' })).toHaveTextContent('?');
  });

  it('BarMeter renders nothing at zero and clamps above one', () => {
    const { container, rerender } = render(<BarMeter ratio={0} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<BarMeter ratio={2} />);
    expect(container.firstChild.style.getPropertyValue('--ratio')).toBe('1');
  });

  it('Card, Dot, ScrollArea and EmptyText render their content', () => {
    render(
      <Card as="section" padding="lg" elevated aria-label="card">
        <Dot colour="var(--color-priority-urgent)" size="md" />
        <ScrollArea axis="x" aria-label="scroller">x</ScrollArea>
        <EmptyText>Nothing overdue or due this week.</EmptyText>
      </Card>,
    );
    expect(screen.getByRole('region', { name: 'card' }).className).toMatch(/elevated/);
    expect(screen.getByText('Nothing overdue or due this week.')).toBeInTheDocument();
  });
});
