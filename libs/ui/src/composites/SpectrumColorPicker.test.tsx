import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpectrumColorPicker } from './SpectrumColorPicker';

const Controlled = ({ onChangeEnd }: { onChangeEnd: (hex: string) => void }) => {
  const [value, setValue] = useState('#ff0000');
  return <SpectrumColorPicker value={value} onChange={setValue} onChangeEnd={onChangeEnd} label="Your color" />;
};

describe('SpectrumColorPicker', () => {
  it('renders a saturation area and a hue bar under one accessible name', () => {
    render(<SpectrumColorPicker value="#3a7bd5" onChange={() => undefined} label="Your color" />);
    expect(screen.getByRole('group', { name: 'Your color' })).toBeInTheDocument();
    expect(screen.getAllByRole('slider')).toHaveLength(2);
  });

  it('reports every change, and the final color when the interaction ends', () => {
    const onChangeEnd = vi.fn();
    render(<Controlled onChangeEnd={onChangeEnd} />);
    const [, hue] = screen.getAllByRole('slider');
    fireEvent.keyDown(hue, { key: 'ArrowRight', keyCode: 39 });
    fireEvent.keyUp(hue, { key: 'ArrowRight' });
    expect(onChangeEnd).toHaveBeenCalledTimes(1);
    expect(onChangeEnd.mock.calls[0][0]).toMatch(/^#[0-9a-f]{6}$/);
    expect(onChangeEnd.mock.calls[0][0]).not.toBe('#ff0000');
  });

  it('marks itself disabled and stops pointer input', () => {
    render(<SpectrumColorPicker value="#3a7bd5" onChange={() => undefined} disabled label="Your color" />);
    const group = screen.getByRole('group', { name: 'Your color' });
    expect(group).toHaveAttribute('aria-disabled', 'true');
    expect(group.className).toContain('pointer-events-none');
  });
});
