// src/stores/authStore.js
import { defineStore } from 'pinia'
import { supabase } from 'src/boot/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
    loading: true,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    userId: (state) => state.user?.id || null,
    userEmail: (state) => state.user?.email || null,
  },

  actions: {
    // Инициализация при старте приложения
    async initAuth() {
      this.loading = true
      
      // Получаем текущую сессию из localStorage
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Ошибка получения сессии:', error)
        this.user = null
        this.session = null
      } else {
        this.session = session
        this.user = session?.user ?? null
      }
      
      this.loading = false
      
      // Подписываемся на изменения авторизации (важно для синхронизации между вкладками)
      supabase.auth.onAuthStateChange((_event, session) => {
        this.session = session
        this.user = session?.user ?? null
        this.loading = false
      })
    },

    // Вход через магическую ссылку
    async signInWithMagicLink(email) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/auth/callback'
        }
      })
      
      if (error) throw error
    },

    // Выход
    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      this.user = null
      this.session = null
    },

    // Обновить сессию вручную (для callback страницы)
    async refreshSession() {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Ошибка обновления сессии:', error)
        return false
      }
      
      if (session) {
        this.session = session
        this.user = session.user
        return true
      }
      
      return false
    }
  },
})