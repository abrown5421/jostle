import { Schema, model } from 'mongoose';
import type { Page } from '@inithium/types';

const navigationConfigSchema = new Schema(
  {
    label:           { type: String, required: true },
    location:        { type: String, enum: ['main', 'profile', 'footer', 'cms', 'none'], required: true },
    order:           { type: Number },
    authenticated:   { type: Boolean },
    anonymous:       { type: Boolean },
    isButton:        { type: Boolean },
    resolveNavPath:  { type: String, default: null },
  },
  { _id: false }
);

const animateEntryValues = [
  'backInDown','backInLeft','backInRight','backInUp',
  'bounceIn','bounceInDown','bounceInLeft','bounceInRight','bounceInUp',
  'fadeIn','fadeInDown','fadeInLeft','fadeInRight','fadeInUp',
  'flipInX','flipInY',
  'lightSpeedInLeft','lightSpeedInRight',
  'rotateIn','rotateInDownLeft','rotateInDownRight','rotateInUpLeft','rotateInUpRight',
  'zoomIn','zoomInDown','zoomInLeft','zoomInRight','zoomInUp',
  'slideInDown','slideInLeft','slideInRight','slideInUp',
];

const animateExitValues = [
  'backOutDown','backOutLeft','backOutRight','backOutUp',
  'bounceOut','bounceOutDown','bounceOutLeft','bounceOutRight','bounceOutUp',
  'fadeOut','fadeOutDown','fadeOutLeft','fadeOutRight','fadeOutUp',
  'fadeOutTopLeft','fadeOutTopRight','fadeOutBottomLeft','fadeOutBottomRight',
  'flipOutX','flipOutY',
  'lightSpeedOutLeft','lightSpeedOutRight',
  'rotateOut','rotateOutDownLeft','rotateOutDownRight','rotateOutUpLeft','rotateOutUpRight',
  'zoomOut','zoomOutDown','zoomOutLeft','zoomOutRight','zoomOutUp',
  'slideOutDown','slideOutLeft','slideOutRight','slideOutUp',
  'hinge','rollOut',
];

const animateSpeedValues = ['slow', 'slower', 'fast', 'faster'];

const themeColorValues = [
  'primary','primary-contrast',
  'secondary','secondary-contrast',
  'accent','accent-contrast',
  'success','success-contrast',
  'warning','warning-contrast',
  'danger','danger-contrast',
  'surface','surface-contrast',
  'surface2','surface2-contrast',
  'surface3','surface3-contrast',
  'surface4','surface4-contrast',
];

const pageSchema = new Schema<Page>(
  {
    key:           { type: String, required: true, unique: true, trim: true },
    path:          { type: String, required: true, unique: true, trim: true },
    componentKey:  { type: String, required: true, trim: true },
    entry:         { type: String, enum: animateEntryValues, required: true },
    exit:          { type: String, enum: animateExitValues, required: true },
    entrySpeed:    { type: String, enum: animateSpeedValues },
    exitSpeed:     { type: String, enum: animateSpeedValues },
    bg:            { type: String, enum: themeColorValues, required: true },
    color:         { type: String, enum: themeColorValues },
    navigation:    { type: navigationConfigSchema },
    centered:      { type: Boolean },
    isErrorPage:   { type: Boolean },
    is_system_page:{ type: Boolean, required: true, default: false },
    isActive:      { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

export const PageModel = model<Page>('Page', pageSchema);
