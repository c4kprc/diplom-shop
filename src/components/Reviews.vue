<template>
  <div class="reviews-section q-mt-xl">
    <div class="row items-center justify-between q-mb-md">
      <h5>Отзывы</h5>
      <div class="row items-center">
        <q-rating
          v-model="avgRating"
          readonly
          size="24px"
          color="yellow-8"
          icon="star"
          icon-selected="star"
        />
        <span class="text-h6 q-ml-sm">{{ avgRating.toFixed(1) }}</span>
        <span class="text-grey q-ml-xs">({{ reviews.length }})</span>
      </div>
    </div>

    <!-- Форма добавления отзыва -->
    <q-card v-if="authStore.isAuthenticated" class="q-mb-md" flat bordered>
      <q-card-section>
        <div class="text-subtitle1 q-mb-sm">Оставить отзыв</div>
        
        <q-rating
          v-model="newReview.rating"
          size="32px"
          color="yellow-8"
          icon="star"
          icon-selected="star"
        />
        
        <q-input
          v-model="newReview.comment"
          label="Ваш комментарий"
          type="textarea"
          outlined
          class="q-mt-md"
          rows="3"
        />
        
        <q-btn
          label="Отправить отзыв"
          color="primary"
          :loading="submitting"
          @click="submitReview"
          class="q-mt-md"
        />
      </q-card-section>
    </q-card>

    <!-- Список отзывов -->
    <div v-if="reviews.length === 0" class="text-grey text-center q-pa-xl">
      <q-icon name="chat_bubble_outline" size="48px" />
      <div class="q-mt-sm">Пока нет отзывов. Будьте первым!</div>
    </div>

    <div v-else>
      <q-card
        v-for="review in reviews"
        :key="review.id"
        flat
        bordered
        class="q-mb-md"
      >
        <q-card-section>
          <div class="row items-center justify-between">
            <div>
              <q-rating
                v-model="review.rating"
                readonly
                size="20px"
                color="yellow-8"
                icon="star"
                icon-selected="star"
              />
            </div>
            <div class="text-caption text-grey">
              {{ formatDate(review.created_at) }}
            </div>
          </div>
          
          <div class="text-subtitle2 q-mt-sm text-grey-8">
            {{ review.user_email }}
          </div>
          
          <div class="q-mt-sm">
            {{ review.comment }}
          </div>
          
          <div v-if="authStore.userId === review.user_id" class="row justify-end q-mt-sm">
            <q-btn
              flat
              color="negative"
              icon="delete"
              label="Удалить"
              size="sm"
              @click="deleteReview(review.id)"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { supabase } from 'boot/supabase'
import { useAuthStore } from 'src/stores/authStore'
import { useQuasar } from 'quasar'

const props = defineProps({
  productId: {
    type: [String, Number],
    required: true
  }
})

const $q = useQuasar()
const authStore = useAuthStore()

const reviews = ref([])
const submitting = ref(false)

const newReview = ref({
  rating: 5,
  comment: ''
})

// Средний рейтинг
const avgRating = computed(() => {
  if (reviews.value.length === 0) return 0
  const sum = reviews.value.reduce((acc, r) => acc + r.rating, 0)
  return sum / reviews.value.length
})

// Загрузка отзывов
async function loadReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', String(props.productId))
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Ошибка загрузки отзывов:', error)
  } else {
    reviews.value = data || []
  }
}

// Добавление отзыва
async function submitReview() {
  if (!newReview.value.rating) {
    $q.notify({ type: 'warning', message: 'Поставьте оценку' })
    return
  }

  if (!newReview.value.comment) {
    $q.notify({ type: 'warning', message: 'Напишите комментарий' })
    return
  }

  submitting.value = true

  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('reviews')
    .insert({
      product_id: String(props.productId),
      user_id: user.id,
      user_email: user.email,
      rating: newReview.value.rating,
      comment: newReview.value.comment
    })

  if (error) {
    console.error('Ошибка отправки:', error)
    $q.notify({ type: 'negative', message: 'Ошибка отправки отзыва' })
  } else {
    $q.notify({ type: 'positive', message: 'Отзыв добавлен!' })
    newReview.value = { rating: 5, comment: '' }
    await loadReviews()
  }

  submitting.value = false
}

// Удаление отзыва
async function deleteReview(reviewId) {
  $q.dialog({
    title: 'Подтверждение',
    message: 'Удалить этот отзыв?',
    cancel: true
  }).onOk(async () => {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) {
      $q.notify({ type: 'negative', message: 'Ошибка удаления' })
    } else {
      $q.notify({ type: 'positive', message: 'Отзыв удалён' })
      await loadReviews()
    }
  })
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Загружаем отзывы при монтировании
loadReviews()

// Следим за изменением productId
watch(() => props.productId, () => {
  loadReviews()
})
</script>