import { AnimationObject, AvatarProps, ThemeColor } from "@inithium/types";

export type AlertPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface AlertProps {
    open: boolean;
    message: string;
    severity: ThemeColor;
    animation_object: AnimationObject;
    closeable?: boolean;
    position?: AlertPosition; 
    avatar?: AvatarProps;
}