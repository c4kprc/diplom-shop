// src/stores/authStore.js
import { defineStore } from 'pinia'
import { supabase } from 'boot/supabase'

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
    async initAuth() {
      this.loading = true
      
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
      
      supabase.auth.onAuthStateChange((_event, session) => {
        this.session = session
        this.user = session?.user ?? null
        this.loading = false
      })
    },

    // МАГИЧЕСКАЯ ССЫЛКА
    async signInWithMagicLink(email) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/auth/callback'
        }
      })
      
      if (error) throw error
    },

    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      this.user = null
      this.session = null
    },

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