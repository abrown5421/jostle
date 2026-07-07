import React from 'react';
import { AutoIncrementingListProps } from './auto-incrementing-list.types';
import { Button } from '../../components';

export const AutoIncrementingList = <T,>({
  items,
  renderItem,
  onAdd,
  onRemove,
  className = '',
  style,
}: AutoIncrementingListProps<T>): React.ReactElement => {
  const totalItems = items.length;

  const handleRemoveClick = (index: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onRemove(index);
  };

  const handleAddClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onAdd();
  };

  return (
    <div className={`space-y-3 ${className}`} style={style}>
      {items.map((item, index) => {
        const isLast = index === totalItems - 1;

        return (
          <div key={index} className="flex items-center space-x-2 w-full">
            <div className="flex-1 min-w-0">
              {renderItem(item, index)}
            </div>
            
            <div className="flex items-center space-x-1 shrink-0">
              <Button
                variant="outline"
                color="danger"
                size="sm"
                icon="Minus"
                onClick={handleRemoveClick(index)}
                aria-label="Remove item"
              />
              
              {isLast && (
                <Button
                  variant="solid"
                  color="primary"
                  size="sm"
                  icon="Plus"
                  onClick={handleAddClick}
                  aria-label="Add item"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};