<template>
  <q-page padding>
    <h4>❤️ Избранные товары</h4>

    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner size="50px" color="primary" />
    </div>

    <div v-else-if="favoritesList.length === 0" class="text-center text-grey q-pa-xl">
      <q-icon name="favorite_border" size="64px" />
      <div class="text-h6 q-mt-md">Нет избранных товаров</div>
      <q-btn color="primary" label="Перейти в каталог" @click="goToCatalog" class="q-mt-md" />
    </div>

    <div v-else class="row q-col-gutter-md">
      <div class="col-12 col-sm-6 col-md-4 col-lg-3" v-for="fav in favoritesList" :key="fav.id">
        <q-card>
          <q-img :src="fav.products?.image" style="height: 200px; width: 100%; object-fit: cover" @click="goToProduct(fav.product_id)" />
          <q-card-section @click="goToProduct(fav.product_id)" style="cursor: pointer">
            <div class="text-subtitle1 text-weight-bold">{{ fav.products?.title }}</div>
            <div class="text-caption text-grey">{{ fav.products?.description?.slice(0, 60) }}...</div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat color="red" icon="delete" label="Удалить" @click="removeFavorite(fav.product_id)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from 'boot/supabase'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()
const favoritesList = ref([])
const loading = ref(true)

onMounted(async () => {
  await loadFavorites()
})

async function loadFavorites() {
  loading.value = true
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    router.push('/login')
    loading.value = false
    return
  }

  const { data: favoritesData } = await supabase.from('favorites').select('*').eq('user_id', user.id)
  if (!favoritesData || favoritesData.length === 0) {
    favoritesList.value = []
    loading.value = false
    return
  }

  const productIds = favoritesData.map(f => f.product_id)
  const { data: productsData } = await supabase.from('products').select('*').in('id', productIds)

  favoritesList.value = favoritesData.map(fav => ({
    ...fav,
    products: productsData?.find(p => String(p.id) === String(fav.product_id))
  }))
  loading.value = false
}

async function removeFavorite(productId) {
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', String(productId))
  favoritesList.value = favoritesList.value.filter(f => f.product_id !== String(productId))
  $q.notify({ type: 'positive', message: 'Удалено из избранного' })
}

function goToProduct(productId) { router.push(`/product/${productId}`) }
function goToCatalog() { router.push('/catalog') }
</script>
</script>