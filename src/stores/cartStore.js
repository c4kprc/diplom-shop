// src/stores/cartStore.js
import { defineStore } from 'pinia'
import { useQuasar } from 'quasar'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [], // { productId, title, price, image, quantity }
  }),

  getters: {
    totalItems: (state) => {
      return state.items.reduce((sum, item) => sum + item.quantity, 0)
    },

    totalPrice: (state) => {
      return state.items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
    },

    cartItems: (state) => state.items,
  },

  actions: {
    // Загрузить корзину из localStorage
    loadCart() {
      const saved = localStorage.getItem('cart')
      if (saved) {
        this.items = JSON.parse(saved)
      }
    },

    // Сохранить корзину в localStorage
    saveCart() {
      localStorage.setItem('cart', JSON.stringify(this.items))
    },

    // Добавить товар
    addItem(product, quantity = 1) {
      const existing = this.items.find(item => item.productId === String(product.id))
      
      if (existing) {
        existing.quantity += quantity
      } else {
        this.items.push({
          productId: String(product.id),
          title: product.title,
          price: product.price || 1000, // временная цена
          image: product.image,
          quantity: quantity
        })
      }
      
      this.saveCart()
    },

    // Удалить товар
    removeItem(productId) {
      this.items = this.items.filter(item => item.productId !== productId)
      this.saveCart()
    },

    // Изменить количество
    updateQuantity(productId, quantity) {
      const item = this.items.find(item => item.productId === productId)
      if (item) {
        if (quantity <= 0) {
          this.removeItem(productId)
        } else {
          item.quantity = quantity
          this.saveCart()
        }
      }
    },

    // Очистить корзину
    clearCart() {
      this.items = []
      this.saveCart()
    },
  },
})