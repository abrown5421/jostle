import type { Unsubscribe } from '@jostle/messaging';
import type { NotificationFormatter } from './types.js';

export interface FormatterRegistry {
  readonly register: <TSourcePayload, TNotificationPayload>(
    topicPattern: string,
    formatter: NotificationFormatter<TSourcePayload, TNotificationPayload>
  ) => Unsubscribe;
  readonly resolve: (topicPattern: string) => NotificationFormatter | undefined;
}

export function createFormatterRegistry(): FormatterRegistry {
  const formatters = new Map<string, NotificationFormatter>();

  const register: FormatterRegistry['register'] = (topicPattern, formatter) => {
    const erased = formatter as NotificationFormatter;
    formatters.set(topicPattern, erased);
    return () => {
      if (formatters.get(topicPattern) === erased) formatters.delete(topicPattern);
    };
  };

  const resolve: FormatterRegistry['resolve'] = (topicPattern) => formatters.get(topicPattern);

  return { register, resolve };
}
