<template>
  <q-page padding>

    <div class="row items-center justify-between q-mb-md">
      <h4>Каталог</h4>
      <q-btn color="primary" label="Добавить товар" @click="openAddDialog" />
    </div>

    <!-- ПОИСК -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6">
        <q-input 
          v-model="search" 
          label="Поиск" 
          outlined 
          clearable 
          debounce="300"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-sm-6">
        <q-select
          v-model="selectedCategory"
          :options="categoryOptions"
          label="Фильтр по категории"
          outlined
          clearable
          emit-value
          map-options
        >
          <template v-slot:prepend>
            <q-icon name="filter_alt" />
          </template>
        </q-select>
      </div>
    </div>

    <!-- ТОВАРЫ -->
    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-6 col-md-4 col-lg-3" v-for="product in paginatedProducts" :key="product.id">
        <q-card class="product-card">
          
          <div @click="goTo(product.id)" style="cursor: pointer">
            <q-img
              :src="product.image"
              style="height: 250px; width: 100%; background-color: #f5f5f5"
              fit="contain"
            />
          </div>
          
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

          <div @click="goTo(product.id)" style="cursor: pointer">
            <q-card-section>
              <div class="text-subtitle1 text-weight-bold">{{ product.title }}</div>
              <div class="text-caption text-grey q-mt-xs">{{ product.description?.slice(0, 60) }}...</div>
              <div class="text-caption text-primary q-mt-xs">
                <q-icon name="label" size="12px" /> {{ product.category || 'Без категории' }}
              </div>
              <div class="text-h6 text-primary q-mt-sm" v-if="product.price">
                {{ product.price }} ₽
              </div>
            </q-card-section>
          </div>

          <q-card-actions v-if="authStore.isAuthenticated && product.user_id === currentUserId" align="right" class="q-pt-none q-pb-md">
            <q-btn flat color="primary" icon="edit" label="Редактировать" size="sm" @click.stop="editProduct(product)" />
          </q-card-actions>

          <q-card-actions v-if="authStore.isAuthenticated" align="right" class="q-pt-none q-pb-md">
            <q-btn flat color="secondary" icon="shopping_cart" label="В корзину" size="sm" @click.stop="addToCart(product)" />
          </q-card-actions>

        </q-card>
      </div>
    </div>

    <!-- ПАГИНАЦИЯ -->
    <div class="row justify-center q-mt-xl" v-if="totalPages > 1">
      <q-pagination
        v-model="currentPage"
        :max="totalPages"
        :max-pages="5"
        direction-links
        boundary-links
        color="primary"
        size="md"
      />
    </div>

    <!-- POPUP ДОБАВЛЕНИЯ ТОВАРА С КАТЕГОРИЕЙ -->
    <q-dialog v-model="showDialog">
      <q-card style="min-width: 450px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">Добавить товар</div>
        </q-card-section>
        
        <q-card-section class="q-gutter-md">
          <q-input v-model="title" label="Название" outlined />
          <q-input v-model="description" label="Описание" type="textarea" outlined />
          
          <!-- ВЫБОР КАТЕГОРИИ (можно выбрать из списка или создать новую) -->
          <q-select
            v-model="selectedProductCategory"
            :options="predefinedCategories"
            label="Категория"
            outlined
            clearable
            use-input
            allow-create
            @new-value="createNewCategory"
            hint="Выберите из списка или введите новую категорию"
          >
            <template v-slot:prepend>
              <q-icon name="label" />
            </template>
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  Введите название новой категории и нажмите Enter
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          
          <q-input v-model="price" label="Цена" type="number" outlined />
          <q-input v-model="video" label="YouTube ссылка" outlined />
          
          <div class="q-mt-md">
            <div class="text-subtitle2 q-mb-sm">Фото товара</div>
            <q-file
              v-model="file"
              label="Выберите файл"
              outlined
              accept="image/*"
            >
              <template v-slot:prepend>
                <q-icon name="photo" />
              </template>
            </q-file>
          </div>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="primary" label="Создать" @click="createProduct" :loading="creating" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- POPUP РЕДАКТИРОВАНИЯ -->
    <q-dialog v-model="showEditDialog">
      <q-card style="min-width: 450px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">Редактировать товар</div>
        </q-card-section>
        
        <q-card-section class="q-gutter-md">
          <q-input v-model="editForm.title" label="Название" outlined />
          <q-input v-model="editForm.description" label="Описание" type="textarea" outlined />
          
          <q-select
            v-model="editForm.category"
            :options="predefinedCategories"
            label="Категория"
            outlined
            clearable
            use-input
            allow-create
            @new-value="createNewCategoryForEdit"
          />
          
          <q-input v-model="editForm.price" label="Цена" type="number" outlined />
          <q-input v-model="editForm.video" label="YouTube ссылка" outlined />
          
          <div v-if="editForm.image" class="q-mt-sm">
            <div class="text-caption">Текущее фото:</div>
            <q-img :src="editForm.image" style="height: 100px; width: auto" fit="contain" />
          </div>
          
          <q-file
            v-model="editFile"
            label="Новое фото (опционально)"
            outlined
            accept="image/*"
          />
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'boot/supabase'
import { useAuthStore } from 'src/stores/authStore'
import { useCartStore } from 'src/stores/cartStore'

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()
const cartStore = useCartStore()

const products = ref([])
const favorites = ref([])
const creating = ref(false)
const editing = ref(false)
const currentUserId = ref(null)

// Фильтры
const search = ref('')
const selectedCategory = ref(null)

// Предопределённые категории
const predefinedCategories = [
  'Drum Kit',
  'Vocal Kit', 
  'Midi Kit',
  'Sample Kit'
]

// Получаем уникальные категории из товаров для фильтра
const categoryOptions = computed(() => {
  const cats = new Set()
  cats.add('Без категории')
  products.value.forEach(p => {
    if (p.category && p.category !== 'Без категории') {
      cats.add(p.category)
    }
  })
  return Array.from(cats).map(cat => ({ label: cat, value: cat === 'Без категории' ? null : cat }))
})

// Пагинация
const currentPage = ref(1)
const itemsPerPage = ref(12)
const totalPages = ref(0)

// Форма добавления
const title = ref('')
const description = ref('')
const selectedProductCategory = ref(null)
const price = ref('')
const video = ref('')
const file = ref(null)

// Форма редактирования
const editForm = ref({
  id: null,
  title: '',
  description: '',
  category: null,
  price: '',
  video: '',
  image: ''
})
const editFile = ref(null)

const showDialog = ref(false)
const showEditDialog = ref(false)

onMounted(async () => {
  if (authStore.isAuthenticated) {
    currentUserId.value = authStore.userId
  }
  await Promise.all([loadProducts(), loadFavorites()])
  updatePagination()
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

// Фильтрация
const filteredProducts = computed(() => {
  let result = products.value
  
  if (search.value) {
    result = result.filter(p =>
      p.title?.toLowerCase().includes(search.value.toLowerCase())
    )
  }
  
  if (selectedCategory.value) {
    result = result.filter(p => p.category === selectedCategory.value)
  }
  
  return result
})

// Пагинация
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredProducts.value.slice(start, end)
})

function updatePagination() {
  totalPages.value = Math.ceil(filteredProducts.value.length / itemsPerPage.value)
  if (currentPage.value > totalPages.value && totalPages.value > 0) {
    currentPage.value = 1
  }
}

watch(filteredProducts, () => {
  updatePagination()
  currentPage.value = 1
}, { deep: true })

function openAddDialog() {
  // Очищаем форму
  title.value = ''
  description.value = ''
  selectedProductCategory.value = null
  price.value = ''
  video.value = ''
  file.value = null
  showDialog.value = true
}

function createNewCategory(val, done) {
  if (val && val.trim()) {
    const newCategory = val.trim()
    if (!predefinedCategories.includes(newCategory)) {
      predefinedCategories.push(newCategory)
    }
    selectedProductCategory.value = newCategory
    done()
  }
}

function createNewCategoryForEdit(val, done) {
  if (val && val.trim()) {
    const newCategory = val.trim()
    if (!predefinedCategories.includes(newCategory)) {
      predefinedCategories.push(newCategory)
    }
    editForm.value.category = newCategory
    done()
  }
}

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
      $q.notify({ type: 'positive', message: 'Удалено из избранного' })
    }
  } else {
    const { data, error } = await supabase
      .from('favorites')
      .insert([{ user_id: user.id, product_id: String(productId) }])
      .select()

    if (!error && data && data[0]) {
      favorites.value.push(data[0])
      $q.notify({ type: 'positive', message: 'Добавлено в избранное' })
    }
  }
}

function addToCart(product) {
  cartStore.addItem({
    id: product.id,
    title: product.title,
    price: product.price || 1000,
    image: product.image
  })
  $q.notify({ type: 'positive', message: 'Товар добавлен в корзину!' })
}

function editProduct(product) {
  editForm.value = {
    id: product.id,
    title: product.title,
    description: product.description,
    category: product.category || null,
    price: product.price || '',
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
      category: editForm.value.category,
      price: editForm.value.price || 1000,
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
    $q.notify({ type: 'warning', message: 'Заполните название, описание и выберите фото' })
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
    category: selectedProductCategory.value || 'Без категории',
    price: price.value || 1000,
    image: imageUrl,
    video: video.value,
    user_id: user.id
  })

  if (insertError) {
    $q.notify({ type: 'negative', message: 'Ошибка создания: ' + insertError.message })
  } else {
    $q.notify({ type: 'positive', message: 'Товар создан!' })
    title.value = ''
    description.value = ''
    selectedProductCategory.value = null
    price.value = ''
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
</style>