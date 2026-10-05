import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CountdownBar } from './CountdownBar';
import { Leaderboard } from './Leaderboard';
import { Podium } from './Podium';

describe('CountdownBar', () => {
  it('counts down to a deadline on the clock it is given', () => {
    render(<CountdownBar endsAt={50_000} totalMs={30_000} now={() => 40_000} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '10');
    expect(screen.getByText('10s')).toBeInTheDocument();
  });

  it('holds at what was left while paused', () => {
    render(<CountdownBar endsAt={null} pausedRemainingMs={4_200} totalMs={30_000} />);
    expect(screen.getByText('5s')).toBeInTheDocument();
  });

  it('never goes below zero', () => {
    render(<CountdownBar endsAt={1_000} totalMs={30_000} now={() => 9_000} showSeconds={false} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.queryByText('0s')).not.toBeInTheDocument();
  });
});

describe('Leaderboard', () => {
  it('renders rows in order with ranks, scores and only positive deltas', () => {
    render(
      <Leaderboard
        title="Standings"
        rows={[
          { id: 'a', name: 'Ann', score: 300, rank: 1, delta: 150 },
          { id: 'b', name: 'Bo', score: 120, rank: 2, delta: 0 },
        ]}
      />,
    );
    const items = within(screen.getByRole('list', { name: 'Standings' })).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('1Ann+150300');
    expect(items[1]).toHaveTextContent('2Bo120');
  });
});

describe('Leaderboard trailing', () => {
  it("renders a row's trailing content before its score", () => {
    render(<Leaderboard rows={[{ id: 'a', name: 'Ann', score: 90, rank: 1, trailing: <span>chip</span> }]} />);
    expect(screen.getByRole('listitem')).toHaveTextContent('1Annchip90');
  });
});

describe('Podium', () => {
  it('shows at most the top three, winner in the middle', () => {
    const { container } = render(
      <Podium
        entries={[
          { id: 'a', name: 'Ann', score: 300, rank: 1 },
          { id: 'b', name: 'Bo', score: 200, rank: 2 },
          { id: 'c', name: 'Cy', score: 100, rank: 3 },
          { id: 'd', name: 'Di', score: 50, rank: 4 },
        ]}
      />,
    );
    expect(screen.queryByText('Di')).not.toBeInTheDocument();
    const names = ['Ann', 'Bo', 'Cy'].map((name) => screen.getByText(name));
    const order = names.map((node) => Array.from(container.querySelectorAll('span')).indexOf(node as HTMLSpanElement));
    // Bo (2nd) renders first, then Ann (1st), then Cy (3rd).
    expect(order[1]).toBeLessThan(order[0]);
    expect(order[0]).toBeLessThan(order[2]);
  });
});
