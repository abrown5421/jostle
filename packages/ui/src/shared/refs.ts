import type { Ref, RefCallback } from 'react';

/**
 * Combines a consumer-supplied ref with an internal one (e.g. the ref our
 * animation hooks need to attach their `animationend` listener) so both
 * receive the same DOM node.
 */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined | null>): RefCallback<T> {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') ref(node);
      else (ref as { current: T | null }).current = node;
    }
  };
}
