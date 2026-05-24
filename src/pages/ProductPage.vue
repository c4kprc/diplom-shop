<template>
  <q-page padding v-if="product">

    <h4>{{ product.title }}</h4>

    <!-- КАРТИНКА -->
    <div class="flex flex-center">
      <q-img
        :src="product.image"
        class="product-image"
      />
    </div>

    <!-- ОПИСАНИЕ -->
    <p class="q-mt-md">
      {{ product.description }}
    </p>

    <!-- Категория -->
    <div v-if="product.category" class="text-caption text-primary q-mt-sm">
      <q-icon name="label" size="14px" /> {{ product.category }}
    </div>

    <!-- Цена (если есть) -->
    <div class="text-h5 text-primary q-mt-md" v-if="product.price">
      {{ product.price }} ₽
    </div>

    <!-- YouTube -->
    <div v-if="product.video" class="flex flex-center">
      <iframe
        :src="embed(product.video)"
        class="video-iframe"
        allowfullscreen
      ></iframe>
    </div>

    <!-- КНОПКИ -->
    <div class="row justify-center q-gutter-md q-mt-lg">
      <q-btn
        label="В корзину"
        color="secondary"
        size="lg"
        @click="addToCart"
      />
      <q-btn
        label="Купить"
        color="primary"
        size="lg"
        @click="showDialog = true"
      />
    </div>

    <!-- ОТЗЫВЫ -->
    <Reviews :product-id="String(product.id)" />

    <!-- POPUP ПОКУПКИ -->
    <q-dialog v-model="showDialog">
      <q-card style="min-width: 300px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">Покупка</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="name"
            label="Ваше имя"
            outlined
          />
          <q-input
            v-model="email"
            label="Email"
            type="email"
            outlined
            class="q-mt-md"
          />
          <q-input
            v-model="message"
            label="Комментарий к заказу"
            type="textarea"
            outlined
            class="q-mt-md"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Отмена"
            v-close-popup
          />
          <q-btn
            color="primary"
            label="Отправить"
            @click="buy"
            :loading="buying"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import emailjs from '@emailjs/browser'
import { supabase } from 'boot/supabase'
import { useQuasar } from 'quasar'
import { useCartStore } from 'src/stores/cartStore'
import Reviews from 'src/components/Reviews.vue'

const route = useRoute()
const $q = useQuasar()
const cartStore = useCartStore()

const product = ref(null)
const name = ref('')
const email = ref('')
const message = ref('')
const showDialog = ref(false)
const buying = ref(false)

onMounted(async () => {
  // Загружаем товар
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', Number(route.params.id))
    .single()

  if (error) {
    console.error('Ошибка загрузки товара:', error)
    $q.notify({ type: 'negative', message: 'Товар не найден' })
    return
  }

  product.value = data

  // Автозаполнение email если пользователь авторизован
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    email.value = user.email
  }
})

// Конвертация YouTube ссылки
function embed(url) {
  if (!url) return ''
  let videoId = ''
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0]
  } else if (url.includes('watch?v=')) {
    videoId = url.split('v=')[1].split('&')[0]
  } else if (url.includes('embed/')) {
    videoId = url.split('embed/')[1].split('?')[0]
  }
  return `https://www.youtube.com/embed/${videoId}`
}

// Добавление в корзину
function addToCart() {
  if (!product.value) return
  
  cartStore.addItem({
    id: product.value.id,
    title: product.value.title,
    price: product.value.price || 1000,
    image: product.value.image
  })
  
  $q.notify({
    type: 'positive',
    message: 'Товар добавлен в корзину!',
    position: 'top'
  })
}

// Покупка (оформление заказа)
async function buy() {
  if (!name.value || !email.value) {
    $q.notify({ type: 'warning', message: 'Заполните имя и email' })
    return
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    $q.notify({ type: 'warning', message: 'Сначала войдите в аккаунт' })
    return
  }

  buying.value = true

  // Сохраняем заказ в БД
  const { error: dbError } = await supabase
    .from('orders')
    .insert({
      name: name.value,
      email: email.value,
      product: product.value.title,
      message: message.value,
      user_id: user.id
    })

  if (dbError) {
    console.error('Ошибка сохранения заказа:', dbError)
    $q.notify({ type: 'negative', message: 'Ошибка сохранения заказа' })
    buying.value = false
    return
  }

  // Отправляем email уведомление
  try {
    await emailjs.send(
      'service_uss3wcs',
      'template_m4nc122',
      {
        name: name.value,
        email: email.value,
        product: product.value.title,
        message: message.value
      },
      'in6H6w9Ya16K3PBEI'
    )
  } catch (emailError) {
    console.error('Ошибка отправки email:', emailError)
  }

  $q.notify({ type: 'positive', message: 'Заказ оформлен!' })
  
  // Очищаем форму
  name.value = ''
  message.value = ''
  showDialog.value = false
  buying.value = false
}
</script>

<style scoped>
.product-image {
  max-width: 400px;
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.video-iframe {
  width: 560px;
  height: 315px;
  max-width: 100%;
  border: none;
  border-radius: 12px;
}

@media (max-width: 600px) {
  .product-image {
    max-width: 100%;
  }
  
  .video-iframe {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
  }
}
</style>