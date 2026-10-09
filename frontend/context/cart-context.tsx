'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartData, CartItem } from '../types';
import { api } from '../lib/api';
import { useAuth } from './auth-context';

interface CartContextType {
  cart: CartData | null;
  itemCount: number;
  isLoading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = async () => {
    if (!user) {
      setCart(null);
      return;
    }
    try {
      setIsLoading(true);
      const data: any = await api.cart.get();
      setCart(data);
    } catch {
      // Ignore initial cart errors
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [user]);

  const addToCart = async (productId: string, quantity = 1) => {
    if (!user) {
      // If not logged in, prompt or redirect
      window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    setIsLoading(true);
    try {
      const updated: any = await api.cart.addItem({ productId, quantity });
      setCart(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeFromCart(cartItemId);
    }
    setIsLoading(true);
    try {
      const updated: any = await api.cart.updateItem(cartItemId, { quantity });
      setCart(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    setIsLoading(true);
    try {
      const updated: any = await api.cart.removeItem(cartItemId);
      setCart(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      await api.cart.clear();
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  };

  const itemCount = cart?.itemsCount ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        isLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
