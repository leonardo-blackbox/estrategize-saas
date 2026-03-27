import { useState } from 'react';
import type { FilterOption, DateRange } from '../types';
import { getRange } from '../utils/analytics-dates';

export function useAnalyticsFilters() {
  const [filter, setFilter] = useState<FilterOption>('30d');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();

  const range = getRange(filter, customRange);

  function handleFilterSelect(opt: FilterOption) {
    setFilter(opt);
    if (opt !== 'custom') setCustomRange(undefined);
  }

  function handleCustomApply(r: DateRange) {
    setCustomRange(r);
    setFilter('custom');
  }

  return { filter, customRange, range, handleFilterSelect, handleCustomApply };
}
