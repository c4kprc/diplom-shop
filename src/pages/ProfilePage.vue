<template>
  <q-page padding>

    <h4>Профиль</h4>

    <!-- USER -->
    <div v-if="user" class="q-mb-lg">

      <p>
        <b>Email:</b> {{ user.email }}
      </p>

      <div class="row q-gutter-md">
        <q-btn
          color="primary"
          label="Каталог"
          @click="router.push('/catalog')"
        />

        <q-btn
          color="pink"
          icon="favorite"
          label="Избранное"
          @click="router.push('/favorites')"
        />

        <q-btn
          color="negative"
          label="Выйти"
          @click="logout"
        />
      </div>

    </div>

    <!-- МОИ ТОВАРЫ -->
    <h5 class="q-mt-xl">Мои товары</h5>

    <div v-if="productsLoading" class="flex flex-center q-pa-md">
      <q-spinner size="40px" color="primary" />
    </div>

    <div v-else-if="products.length === 0" class="q-mb-lg text-grey">
      Товаров пока нет
    </div>

    <div v-else class="row q-col-gutter-md">
      <div
        class="col-3"
        v-for="product in products"
        :key="product.id"
      >
        <q-card>
          <q-img
            :src="product.image"
            style="height: 200px; cursor: pointer"
            @click="router.push(`/product/${product.id}`)"
          />

          <q-card-section>
            <div class="text-h6">
              {{ product.title }}
            </div>
            <div class="text-caption text-grey">
              {{ product.description?.slice(0, 80) }}...
            </div>

            <q-btn
              color="negative"
              label="Удалить"
              class="q-mt-md"
              flat
              @click="removeProduct(product.id)"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- МОИ ЗАКАЗЫ -->
    <h5 class="q-mt-xl">Мои заказы</h5>

    <div v-if="ordersLoading" class="flex flex-center q-pa-md">
      <q-spinner size="40px" color="primary" />
    </div>

    <div v-else-if="orders.length === 0" class="text-grey">
      Заказов пока нет
    </div>

    <div v-else>
      <q-card
        v-for="order in orders"
        :key="order.id"
        class="q-mb-md"
        flat
        bordered
      >
        <q-card-section>
          <div class="text-h6">
            {{ order.product }}
          </div>
          <div class="text-caption text-grey">
            {{ order.created_at ? new Date(order.created_at).toLocaleDateString() : '' }}
          </div>
          <div class="q-mt-sm">
            {{ order.message }}
          </div>
          <div class="text-caption q-mt-sm">
            <b>Имя:</b> {{ order.name }}<br>
            <b>Email:</b> {{ order.email }}
          </div>
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

const router = useRouter()
const $q = useQuasar()

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
    $q.notify({
      type: 'warning',
      message: 'Сначала войдите в аккаунт'
    })
    router.push('/login')
    return
  }

  user.value = currentUser

  await loadOrders(currentUser.id)
  await loadProducts(currentUser.id)
}

async function loadOrders(userId) {
  ordersLoading.value = true
  
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('id', { ascending: false })

  if (error) {
    console.error('Ошибка загрузки заказов:', error)
  } else {
    orders.value = data || []
  }
  
  ordersLoading.value = false
}

async function loadProducts(userId) {
  productsLoading.value = true
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .order('id', { ascending: false })

  if (error) {
    console.error('Ошибка загрузки товаров:', error)
  } else {
    products.value = data || []
  }
  
  productsLoading.value = false
}

async function removeProduct(id) {
  $q.dialog({
    title: 'Подтверждение',
    message: 'Вы уверены, что хотите удалить этот товар?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      $q.notify({
        type: 'negative',
        message: 'Ошибка удаления товара'
      })
    } else {
      products.value = products.value.filter(product => product.id !== id)
      $q.notify({
        type: 'positive',
        message: 'Товар удалён'
      })
    }
  })
}

async function logout() {
  $q.dialog({
    title: 'Выход',
    message: 'Вы уверены, что хотите выйти?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await supabase.auth.signOut()
    $q.notify({
      type: 'info',
      message: 'Вы вышли из аккаунта'
    })
    router.push('/login')
  })
}
</script>

<style scoped>
/* Адаптация под мобилки */
@media (max-width: 768px) {
  .col-3 {
    width: 50% !important;
  }
}

@media (max-width: 480px) {
  .col-3 {
    width: 100% !important;
  }
}
</style>