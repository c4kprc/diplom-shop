<template>
  <div class="row flex-center" style="min-height: 100vh; background: #f5f5f5;">
    <div class="text-center">
      <q-spinner size="50px" color="primary" />
      <div class="q-mt-md text-subtitle1">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/authStore'
import { useQuasar } from 'quasar'

const router = useRouter()
const authStore = useAuthStore()
const $q = useQuasar()
const message = ref('Выполняется вход...')

onMounted(async () => {
  try {
    const success = await authStore.refreshSession()
    
    if (success && authStore.isAuthenticated) {
      message.value = 'Вход выполнен! Перенаправление...'
      $q.notify({
        type: 'positive',
        message: 'Добро пожаловать!',
        position: 'top'
      })
      
      setTimeout(() => {
        router.push('/catalog')
      }, 500)
    } else {
      throw new Error('Не удалось получить сессию')
    }
  } catch (error) {
    console.error('Auth callback error:', error)
    message.value = 'Ошибка входа :('
    $q.notify({
      type: 'negative',
      message: 'Не удалось войти. Попробуйте ещё раз.',
      position: 'top',
      timeout: 3000
    })
    
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }
})
</script>