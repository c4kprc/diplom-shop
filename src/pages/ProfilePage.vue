<template>
  <q-page padding>

    <h4>Профиль</h4>

    <div v-if="user" class="q-mb-lg">
      <p><b>Email:</b> {{ user.email }}</p>

      <div class="row q-gutter-md">
        <q-btn color="primary" label="Каталог" @click="goToCatalog" />
        <q-btn color="pink" icon="favorite" label="Избранное" @click="goToFavorites" />
        <q-btn color="negative" label="Выйти" @click="handleLogout" /> <!-- 👈 ИСПРАВЛЕНО -->
      </div>
    </div>

    <!-- МОИ ТОВАРЫ -->
    <h5 class="q-mt-xl">Мои товары</h5>
    <div v-if="productsLoading" class="flex flex-center q-pa-md">
      <q-spinner size="40px" color="primary" />
    </div>
    <div v-else-if="products.length === 0" class="text-grey">Товаров пока нет</div>
    <div v-else class="row q-col-gutter-md">
      <div class="col-12 col-sm-6 col-md-4" v-for="product in products" :key="product.id">
        <q-card>
          <q-img :src="product.image" style="height: 200px; width: 100%; object-fit: cover" @click="goToProduct(product.id)" />
          <q-card-section>
            <div class="text-h6">{{ product.title }}</div>
            <div class="text-caption text-grey">{{ product.description?.slice(0, 80) }}...</div>
            <q-btn color="negative" label="Удалить" flat class="q-mt-md" @click="removeProduct(product.id)" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- МОИ ЗАКАЗЫ -->
    <h5 class="q-mt-xl">Мои заказы</h5>
    <div v-if="ordersLoading" class="flex flex-center q-pa-md">
      <q-spinner size="40px" color="primary" />
    </div>
    <div v-else-if="orders.length === 0" class="text-grey">Заказов пока нет</div>
    <div v-else>
      <q-card v-for="order in orders" :key="order.id" class="q-mb-md" flat bordered>
        <q-card-section>
          <div class="text-h6">{{ order.product }}</div>
          <div class="text-caption text-grey">{{ new Date(order.created_at).toLocaleDateString() }}</div>
          <div class="q-mt-sm">{{ order.message }}</div>
          <div class="text-caption q-mt-sm"><b>Имя:</b> {{ order.name }}<br><b>Email:</b> {{ order.email }}</div>
        </q-card-section>
      </q-card>
    </div>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from 'boot/supabase'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/authStore'

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()

const user = ref(null)
const orders = ref([])
const products = ref([])
const productsLoading = ref(true)
const ordersLoading = ref(true)

onMounted(async () => {
  await loadUserAndData()
})

async function loadUserAndData() {
  const {
    data: { user: currentUser }
  } = await supabase.auth.getUser()

  if (!currentUser) {
    router.push('/login')
    return
  }

  user.value = currentUser

  await loadOrders(currentUser.id)
  await loadProducts(currentUser.id)
}

async function loadOrders(userId) {
  ordersLoading.value = true
  const { data } = await supabase.from('orders').select('*').eq('user_id', userId).order('id', { ascending: false })
  orders.value = data || []
  ordersLoading.value = false
}

async function loadProducts(userId) {
  productsLoading.value = true
  const { data } = await supabase.from('products').select('*').eq('user_id', userId).order('id', { ascending: false })
  products.value = data || []
  productsLoading.value = false
}

async function removeProduct(id) {
  $q.dialog({
    title: 'Подтверждение',
    message: 'Удалить товар?',
    cancel: true
  }).onOk(async () => {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) {
      products.value = products.value.filter(p => p.id !== id)
      $q.notify({ type: 'positive', message: 'Товар удалён' })
    }
  })
}

// 👈 ИСПРАВЛЕННАЯ ФУНКЦИЯ ВЫХОДА
async function handleLogout() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Ошибка выхода:', error)
    $q.notify({ type: 'negative', message: 'Ошибка выхода' })
  } else {
    // Очищаем store
    authStore.user = null
    authStore.session = null
    
    $q.notify({ type: 'positive', message: 'Вы вышли из аккаунта' })
    router.push('/catalog')
  }
}

function goToCatalog() { router.push('/catalog') }
function goToFavorites() { router.push('/favorites') }
function goToProduct(id) { router.push(`/product/${id}`) }
</script>