<template>
  <q-page padding v-if="product">

    <h4>{{ product.title }}</h4>

    <!-- КАРТИНКА ПО ЦЕНТРУ -->
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

    <!-- YouTube -->
    <div v-if="product.video" class="flex flex-center">
      <iframe
        :src="embed(product.video)"
        class="video-iframe"
        allowfullscreen
      ></iframe>
    </div>

    <!-- КНОПКА -->
    <div class="flex flex-center q-mt-lg">
      <q-btn
        label="Купить"
        color="primary"
        @click="showDialog = true"
      />
    </div>

    <!-- POPUP -->
    <q-dialog v-model="showDialog">
      <q-card style="min-width: 300px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">Покупка</div>
        </q-card-section>

        <q-card-section>
          <q-input v-model="name" label="Ваше имя" />
          <q-input v-model="email" label="Email" class="q-mt-md" />
          <q-input v-model="message" label="Комментарий к заказу" type="textarea" class="q-mt-md" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="primary" label="Отправить" @click="buy" />
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

const route = useRoute()
const $q = useQuasar()
const product = ref(null)

const name = ref('')
const email = ref('')
const message = ref('')
const showDialog = ref(false)

onMounted(async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', Number(route.params.id))
    .single()

  console.log('DATA:', data)
  console.log('ERROR:', error)

  if (!error) {
    product.value = data
  }

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (user) {
    email.value = user.email
  }
})

function embed(url) {
  if (!url) return ''
  let videoId = ''
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0]
  } else if (url.includes('watch?v=')) {
    videoId = url.split('v=')[1].split('&')[0]
  }
  return `https://www.youtube.com/embed/${videoId}`
}

async function buy() {
  if (!name.value || !email.value) {
    $q.notify({ type: 'warning', message: 'Заполните имя и email' })
    return
  }

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    $q.notify({ type: 'warning', message: 'Сначала войдите в аккаунт' })
    return
  }

  const { error: dbError } = await supabase
    .from('orders')
    .insert([
      {
        name: name.value,
        email: email.value,
        product: product.value.title,
        message: message.value,
        user_id: user.id
      }
    ])

  if (dbError) {
    $q.notify({ type: 'negative', message: 'Ошибка сохранения заказа' })
    return
  }

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

  $q.notify({ type: 'positive', message: 'Заказ оформлен!' })
  name.value = ''
  message.value = ''
  showDialog.value = false
}
</script>

<style scoped>
/* Картинка - как раньше, но адаптивная */
.product-image {
  max-width: 400px;
  width: 100%;
  height: auto;
}

/* Видео - адаптивное */
.video-iframe {
  width: 560px;
  height: 315px;
  max-width: 100%;
  border: none;
}

/* Адаптация под мобилки */
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