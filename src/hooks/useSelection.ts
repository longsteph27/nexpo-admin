import { useState, useCallback } from 'react';

export function useSelection<T extends string = string>() {
  const [selected, setSelected] = useState<Set<T>>(new Set());

  const toggle = useCallback((id: T) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: T[]) => {
    setSelected((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback((id: T) => selected.has(id), [selected]);

  const isAllSelected = useCallback(
    (ids: T[]) => ids.length > 0 && ids.every((id) => selected.has(id)),
    [selected]
  );

  const isIndeterminate = useCallback(
    (ids: T[]) => ids.some((id) => selected.has(id)) && !ids.every((id) => selected.has(id)),
    [selected]
  );

  return {
    selected,
    selectedArray: Array.from(selected),
    count: selected.size,
    toggle,
    toggleAll,
    clear,
    isSelected,
    isAllSelected,
    isIndeterminate,
  };
}
