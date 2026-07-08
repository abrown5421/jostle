import { useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState } from '../../store.js';

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;