"use client"

import { create } from "zustand"
import { addDays } from "date-fns"

interface DateRange {
  from: Date
  to: Date
}

interface AnalyticsStore {
  dateRange: DateRange
  setDateRange: (from: Date, to: Date) => void
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  dateRange: {
    from: addDays(new Date(), -30),
    to: new Date(),
  },
  setDateRange: (from: Date, to: Date) => set({ dateRange: { from, to } }),
}))