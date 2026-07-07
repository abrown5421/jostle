import { Text } from '@inithium/ui';
import React from 'react';

interface SectionLabelProps {
  label: string;
}

const SectionLabel: React.FC<SectionLabelProps> = ({ label }) => (
  <Text
    variant="caption"
    overrideClassName="text-xs font-bold uppercase tracking-wider text-secondary mt-2 px-1"
  >
    {label}
  </Text>
);

export default SectionLabel;