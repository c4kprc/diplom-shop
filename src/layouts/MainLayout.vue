<template>
  <q-layout view="lHh Lpr lFf">

    <!-- HEADER -->
    <q-header elevated>

      <q-toolbar>

        <q-toolbar-title>
          Магазин
        </q-toolbar-title>

        <!-- каталог -->
        <q-btn
          flat
          to="/"
          label="Каталог"
        />

        <!-- если НЕ залогинен -->
        <q-btn
          v-if="!user"
          flat
          to="/auth"
          label="Войти"
        />

        <!-- если залогинен -->
        <template v-else>

          <q-btn
            flat
            to="/profile"
            label="Профиль"
          />

          <q-btn
            flat
            color="negative"
            label="Выйти"
            @click="logout"
          />

        </template>

      </q-toolbar>

    </q-header>

    <!-- СТРАНИЦЫ -->
    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from 'boot/supabase'

const router = useRouter()

const user = ref(null)

// 🔥 загрузка пользователя
async function loadUser() {

  const {
    data: { user: currentUser }
  } = await supabase.auth.getUser()

  user.value = currentUser

  console.log('USER:', currentUser)

}

// 🔥 старт
onMounted(async () => {

  await loadUser()

  supabase.auth.onAuthStateChange(
    async () => {

      await loadUser()

    }
  )

})

// 🔥 выход
async function logout() {

  await supabase.auth.signOut()

  user.value = null

  router.push('/')

}
</script>