<template>
  <q-layout view="hHh Lpr lff">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          <q-btn flat label="Интернет-магазин" to="/catalog" />
        </q-toolbar-title>

        <q-btn flat label="Каталог" to="/catalog" />

        <q-btn flat icon="shopping_cart" @click="cartDrawerRef?.openDrawer()">
          <q-badge v-if="cartStore.totalItems > 0" color="red" floating>
            {{ cartStore.totalItems }}
          </q-badge>
        </q-btn>

        <q-btn 
          v-if="authStore.isAuthenticated" 
          flat 
          label="Профиль" 
          to="/profile" 
        />
        <q-btn 
          v-else 
          flat 
          label="Войти" 
          to="/login" 
        />

        <q-btn 
          v-if="authStore.isAuthenticated" 
          flat 
          icon="favorite" 
          label="Избранное" 
          to="/favorites" 
        />

        <q-btn 
          v-if="authStore.isAuthenticated" 
          flat 
          label="Выйти" 
          @click="handleLogout" 
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <CartDrawer ref="cartDrawerRef" />

    <q-footer elevated class="bg-grey-10 text-white q-pa-md">
      <div class="text-center">
        <div class="text-caption q-mb-sm">© 2024 Интернет-магазин</div>
        <q-btn 
          flat 
          color="white" 
          icon="telegram" 
          label="Написать в поддержку" 
          href="https://t.me/твой_ник" 
          target="_blank" 
        />
      </div>
    </q-footer>

  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from 'src/stores/authStore'
import { useCartStore } from 'src/stores/cartStore'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import CartDrawer from 'src/components/CartDrawer.vue'

const authStore = useAuthStore()
const cartStore = useCartStore()
const router = useRouter()
const $q = useQuasar()
const cartDrawerRef = ref(null)

cartStore.loadCart()

// 👈 ИСПРАВЛЕННАЯ ФУНКЦИЯ ВЫХОДА
async function handleLogout() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Ошибка выхода:', error)
    $q.notify({ type: 'negative', message: 'Ошибка выхода' })
  } else {
    authStore.user = null
    authStore.session = null
    $q.notify({ type: 'positive', message: 'Вы вышли из аккаунта' })
    router.push('/catalog')
  }
}
</script>