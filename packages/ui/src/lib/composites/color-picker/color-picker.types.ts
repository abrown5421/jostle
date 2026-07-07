import { InputProps } from "../../components";

export interface ColorPickerProps extends Omit<InputProps, 'leadingIcon' | 'trailingIcon'> {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => unknown;
  onColorChange?: (hex: string) => unknown;
}