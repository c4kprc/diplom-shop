<template>
  <q-page padding>

    <div class="row items-center justify-between q-mb-md">
      <h4>Каталог</h4>
      <q-btn color="primary" label="Добавить товар" @click="showDialog = true" />
    </div>

    <!-- ПОИСК -->
    <q-input v-model="search" label="Поиск" class="q-mb-md" outlined clearable debounce="300" />

    <!-- ТОВАРЫ -->
    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-6 col-md-4 col-lg-3" v-for="product in filtered" :key="product.id">
        <q-card class="product-card">
          
          <!-- КАРТИНКА - ПОЛНАЯ, КАК РАНЬШЕ -->
          <div @click="goTo(product.id)" style="cursor: pointer">
            <q-img
              :src="product.image"
              style="height: 250px; width: 100%; object-fit: cover"
            />
          </div>
          
          <!-- ❤️ сердечко - поверх картинки -->
          <div class="absolute-top-right q-pa-sm" style="z-index: 10">
            <q-btn
              round
              flat
              size="sm"
              :icon="isFavorite(product.id) ? 'favorite' : 'favorite_border'"
              color="red"
              @click.stop="toggleFavorite(product.id)"
            />
          </div>

          <!-- ИНФОРМАЦИЯ О ТОВАРЕ -->
          <div @click="goTo(product.id)" style="cursor: pointer">
            <q-card-section>
              <div class="text-subtitle1 text-weight-bold">{{ product.title }}</div>
              <div class="text-caption text-grey">{{ product.description?.slice(0, 60) }}...</div>
            </q-card-section>
          </div>

          <!-- КНОПКА РЕДАКТИРОВАНИЯ - ВНИЗУ, НЕ ЛОМАЕТ СЕТКУ -->
          <q-card-actions v-if="product.user_id === currentUserId" align="right" class="q-pt-none q-pb-md">
            <q-btn flat color="primary" icon="edit" label="Редактировать" size="sm" @click.stop="editProduct(product)" />
          </q-card-actions>

        </q-card>
      </div>
    </div>

    <!-- POPUP ДОБАВЛЕНИЯ -->
    <q-dialog v-model="showDialog">
      <q-card style="min-width: 400px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">Добавить товар</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="title" label="Название" outlined />
          <q-input v-model="description" label="Описание" type="textarea" outlined />
          <input type="file" @change="handleFile" />
          <q-input v-model="video" label="YouTube ссылка" outlined />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="primary" label="Создать" @click="createProduct" :loading="creating" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- POPUP РЕДАКТИРОВАНИЯ -->
    <q-dialog v-model="showEditDialog">
      <q-card style="min-width: 400px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">Редактировать товар</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="editForm.title" label="Название" outlined />
          <q-input v-model="editForm.description" label="Описание" type="textarea" outlined />
          <q-input v-model="editForm.video" label="YouTube ссылка" outlined />
          <div v-if="editForm.image" class="q-mt-sm">
            <div class="text-caption">Текущее фото:</div>
            <q-img :src="editForm.image" style="height: 100px; width: auto" />
          </div>
          <input type="file" @change="handleEditFile" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="primary" label="Сохранить" @click="updateProduct" :loading="editing" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'boot/supabase'

const router = useRouter()
const $q = useQuasar()

const products = ref([])
const favorites = ref([])
const creating = ref(false)
const editing = ref(false)
const currentUserId = ref(null)

const search = ref('')
const showDialog = ref(false)
const showEditDialog = ref(false)

// Форма добавления
const title = ref('')
const description = ref('')
const video = ref('')
const file = ref(null)

// Форма редактирования
const editForm = ref({
  id: null,
  title: '',
  description: '',
  video: '',
  image: ''
})
const editFile = ref(null)

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    currentUserId.value = user.id
  }
  await Promise.all([loadProducts(), loadFavorites()])
})

async function loadProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id', { ascending: false })

  if (!error) {
    products.value = data || []
  }
}

async function loadFavorites() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', user.id)

  if (!error && data) {
    favorites.value = data
  }
}

function handleFile(event) {
  file.value = event.target.files[0]
}

function handleEditFile(event) {
  editFile.value = event.target.files[0]
}

const filtered = computed(() =>
  products.value.filter(p =>
    p.title?.toLowerCase().includes(search.value.toLowerCase())
  )
)

function isFavorite(productId) {
  return favorites.value.some(f => String(f.product_id) === String(productId))
}

async function toggleFavorite(productId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    $q.notify({ type: 'warning', message: 'Сначала войдите' })
    return
  }

  const existing = favorites.value.find(f => String(f.product_id) === String(productId))

  if (existing) {
    const { error } = await supabase.from('favorites').delete().eq('id', existing.id)
    if (!error) {
      favorites.value = favorites.value.filter(f => f.id !== existing.id)
      $q.notify({ type: 'positive', message: 'Удалено' })
    }
  } else {
    const { data, error } = await supabase
      .from('favorites')
      .insert([{ user_id: user.id, product_id: String(productId) }])
      .select()

    if (!error && data && data[0]) {
      favorites.value.push(data[0])
      $q.notify({ type: 'positive', message: 'Добавлено' })
    }
  }
}

// Редактирование
function editProduct(product) {
  editForm.value = {
    id: product.id,
    title: product.title,
    description: product.description,
    video: product.video || '',
    image: product.image
  }
  editFile.value = null
  showEditDialog.value = true
}

async function updateProduct() {
  if (!editForm.value.title || !editForm.value.description) {
    $q.notify({ type: 'warning', message: 'Заполните название и описание' })
    return
  }

  editing.value = true

  let imageUrl = editForm.value.image

  // Если загружено новое фото
  if (editFile.value) {
    const fileName = Date.now() + '_' + editFile.value.name
    const { error: uploadError } = await supabase.storage.from('products').upload(fileName, editFile.value)

    if (uploadError) {
      $q.notify({ type: 'negative', message: 'Ошибка загрузки фото' })
      editing.value = false
      return
    }

    const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName)
    imageUrl = publicUrlData.publicUrl
  }

  const { error } = await supabase
    .from('products')
    .update({
      title: editForm.value.title,
      description: editForm.value.description,
      video: editForm.value.video,
      image: imageUrl
    })
    .eq('id', editForm.value.id)

  if (error) {
    $q.notify({ type: 'negative', message: 'Ошибка обновления' })
  } else {
    $q.notify({ type: 'positive', message: 'Товар обновлён!' })
    showEditDialog.value = false
    await loadProducts()
  }

  editing.value = false
}

async function createProduct() {
  if (!title.value || !description.value || !file.value) {
    $q.notify({ type: 'warning', message: 'Заполните все поля' })
    return
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    $q.notify({ type: 'warning', message: 'Сначала войдите' })
    return
  }

  creating.value = true

  const fileName = Date.now() + '_' + file.value.name
  const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file.value)

  if (uploadError) {
    $q.notify({ type: 'negative', message: 'Ошибка загрузки фото' })
    creating.value = false
    return
  }

  const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName)
  const imageUrl = publicUrlData.publicUrl

  const { error: insertError } = await supabase.from('products').insert({
    title: title.value,
    description: description.value,
    image: imageUrl,
    video: video.value,
    user_id: user.id
  })

  if (insertError) {
    $q.notify({ type: 'negative', message: 'Ошибка создания' })
  } else {
    $q.notify({ type: 'positive', message: 'Товар создан!' })
    title.value = ''
    description.value = ''
    video.value = ''
    file.value = null
    showDialog.value = false
    await loadProducts()
  }

  creating.value = false
}

function goTo(id) {
  router.push(`/product/${id}`)
}
</script>

<style scoped>
.product-card {
  transition: transform 0.2s;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-4px);
}

/* Картинка на всю ширину, как в каталоге */
.q-img {
  width: 100%;
}
</style>