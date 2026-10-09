'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';

interface CompareContextType {
  compareItems: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareItems, setCompareItems] = useState<Product[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('markethub_compare');
      if (saved) {
        setCompareItems(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const save = (items: Product[]) => {
    setCompareItems(items);
    localStorage.setItem('markethub_compare', JSON.stringify(items));
  };

  const addToCompare = (product: Product) => {
    if (compareItems.some((item) => item.id === product.id)) return;
    if (compareItems.length >= 4) {
      alert('You can compare a maximum of 4 products at a time.');
      return;
    }
    const updated = [...compareItems, product];
    save(updated);
  };

  const removeFromCompare = (productId: string) => {
    const updated = compareItems.filter((i) => i.id !== productId);
    save(updated);
  };

  const clearCompare = () => {
    save([]);
  };

  const isInCompare = (productId: string) => {
    return compareItems.some((i) => i.id === productId);
  };

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
