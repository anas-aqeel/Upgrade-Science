'use client';

import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // After hydration, load from localStorage
  useEffect(() => {
    setIsHydrated(true);
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

// Progress tracking types
export interface StepProgress {
  mainStepId: string;
  subStepId: string;
  completed: boolean;
  checklistProgress: Record<string, boolean>;
}

export interface UpgradeProgress {
  currentMainStep: string;
  currentSubStep: string;
  expandedMainSteps: string[];
  steps: StepProgress[];
  lastUpdated: string;
}

export const DEFAULT_PROGRESS: UpgradeProgress = {
  currentMainStep: 'baseline',
  currentSubStep: 'baseline-goal',
  expandedMainSteps: ['baseline'],
  steps: [],
  lastUpdated: new Date().toISOString()
};
