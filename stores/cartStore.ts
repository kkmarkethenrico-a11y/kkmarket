'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  announcementId: string
  announcementSlug: string
  title: string
  imageUrl: string | null
  price: number
  quantity: number
  selectedItemId?: string
  selectedItemLabel?: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (announcementId: string, selectedItemId?: string) => void
  updateQuantity: (announcementId: string, quantity: number, selectedItemId?: string) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find(
            (i) =>
              i.announcementId === item.announcementId &&
              i.selectedItemId === item.selectedItemId
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.announcementId === item.announcementId &&
                i.selectedItemId === item.selectedItemId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: 1 }] }
        })
      },

      removeItem: (announcementId, selectedItemId) => {
        set((state) => ({
          items: state.items.filter(
            (i) =>
              !(
                i.announcementId === announcementId &&
                i.selectedItemId === selectedItemId
              )
          ),
        }))
      },

      updateQuantity: (announcementId, quantity, selectedItemId) => {
        if (quantity <= 0) {
          get().removeItem(announcementId, selectedItemId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.announcementId === announcementId &&
            i.selectedItemId === selectedItemId
              ? { ...i, quantity }
              : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'kkmarket-cart' }
  )
)
