<!-- src/App.vue -->
<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from 'src/stores/authStore'

const authStore = useAuthStore()

onMounted(async () => {
  // Инициализируем авторизацию при старте приложения
  await authStore.initAuth()
  
  console.log('App initialized, auth ready:', authStore.isAuthenticated)
})
</script>