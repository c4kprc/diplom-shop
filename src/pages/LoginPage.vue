<template>
  <div class="row flex-center" style="min-height: 100vh; background: #f5f5f5;">
    <div class="col-12 col-sm-6 col-md-4">
      <q-card>
        <q-card-section>
          <div class="text-h5 text-center q-py-md">
            Интернет-магазин
          </div>
          <div class="text-subtitle2 text-center text-grey">
            Войдите, чтобы продолжить
          </div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="email"
            type="email"
            label="Email"
            outlined
            :loading="loading"
            @keyup.enter="handleLogin"
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions align="center" class="q-pb-md">
          <q-btn
            label="Отправить ссылку для входа"
            color="primary"
            :loading="loading"
            @click="handleLogin"
            style="width: 90%"
            size="lg"
          />
        </q-card-actions>

        <q-card-section class="text-center text-caption text-grey">
          На указанную почту придёт магическая ссылка<br>
          Перейдите по ней, чтобы войти в аккаунт
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from 'src/stores/authStore'
import { useQuasar } from 'quasar'

const email = ref('')
const loading = ref(false)
const authStore = useAuthStore()
const $q = useQuasar()

async function handleLogin() {
  if (!email.value) {
    $q.notify({
      type: 'warning',
      message: 'Введите email',
      position: 'top'
    })
    return
  }

  if (!email.value.includes('@')) {
    $q.notify({
      type: 'warning',
      message: 'Введите корректный email',
      position: 'top'
    })
    return
  }

  loading.value = true

  try {
    await authStore.signInWithMagicLink(email.value)
    $q.notify({
      type: 'positive',
      message: 'Ссылка для входа отправлена! Проверьте почту ✉️',
      position: 'top',
      timeout: 5000
    })
    email.value = ''
  } catch (error) {
    console.error('Login error:', error)
    
    let message = 'Ошибка при отправке ссылки'
    if (error.message.includes('rate limit')) {
      message = 'Слишком много попыток. Подождите 1-2 минуты'
    } else if (error.message.includes('Invalid email')) {
      message = 'Неверный формат email'
    }
    
    $q.notify({
      type: 'negative',
      message: message,
      position: 'top',
      timeout: 4000
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:deep(.q-card) {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
</style>