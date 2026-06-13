import React, { createContext, useContext, useState, useCallback } from "react";

interface CompareItem {
  productId: string;
  title: string;
  titleAr?: string;
}

interface CompareContextType {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  removeItem: (productId: string) => void;
  clearAll: () => void;
  isComparing: (productId: string) => boolean;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);

  const addItem = useCallback((item: CompareItem) => {
    setItems((prev) => {
      if (prev.length >= 4 || prev.find((i) => i.productId === item.productId)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearAll = useCallback(() => setItems([]), []);
  const isComparing = useCallback((productId: string) => items.some((i) => i.productId === productId), [items]);

  return (
    <CompareContext.Provider value={{ items, addItem, removeItem, clearAll, isComparing, isFull: items.length >= 4 }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare must be used within CompareProvider");
  return context;
}
