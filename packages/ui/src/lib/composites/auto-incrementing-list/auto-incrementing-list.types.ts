export interface AutoIncrementingListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onAdd: () => unknown;
  onRemove: (index: number) => unknown;
  className?: string;
  style?: React.CSSProperties;
}