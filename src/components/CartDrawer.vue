<template>
  <q-drawer v-model="drawerOpen" side="right" bordered :width="350">
    <q-toolbar class="bg-primary text-white">
      <q-toolbar-title>Корзина</q-toolbar-title>
      <q-btn flat round icon="close" @click="closeDrawer" /> <!-- 👈 ИСПРАВЛЕНО -->
    </q-toolbar>

    <q-list v-if="cartStore.items.length === 0">
      <q-item>
        <q-item-section class="text-center text-grey q-pa-md">
          <q-icon name="shopping_cart" size="64px" />
          <div class="text-h6 q-mt-sm">Корзина пуста</div>
        </q-item-section>
      </q-item>
    </q-list>

    <q-list v-else>
      <q-item v-for="item in cartStore.items" :key="item.productId" class="q-pa-md">
        <q-item-section avatar>
          <q-img :src="item.image" style="width: 50px; height: 50px; object-fit: cover" />
        </q-item-section>

        <q-item-section>
          <q-item-label>{{ item.title }}</q-item-label>
          <q-item-label caption>{{ item.price }} ₽</q-item-label>
        </q-item-section>

        <q-item-section side>
          <div class="row items-center q-gutter-sm">
            <q-btn flat round dense icon="remove" size="sm" @click="updateQuantity(item.productId, item.quantity - 1)" />
            <span class="text-weight-bold">{{ item.quantity }}</span>
            <q-btn flat round dense icon="add" size="sm" @click="updateQuantity(item.productId, item.quantity + 1)" />
          </div>
        </q-item-section>

        <q-item-section side>
          <q-btn flat round dense icon="delete" color="negative" @click="cartStore.removeItem(item.productId)" />
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item class="q-pa-md">
        <q-item-section>
          <q-item-label class="text-h6">Итого:</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-item-label class="text-h6 text-primary">{{ cartStore.totalPrice }} ₽</q-item-label>
        </q-item-section>
      </q-item>

      <q-item class="q-pa-md">
        <q-btn
          label="Оформить заказ"
          color="primary"
          class="full-width"
          size="lg"
          @click="checkout"
        />
      </q-item>
    </q-list>
  </q-drawer>
</template>

<script setup>
import { ref } from 'vue'
import { useCartStore } from 'src/stores/cartStore'
import { useQuasar } from 'quasar'
import { supabase } from 'boot/supabase'

const cartStore = useCartStore()
const $q = useQuasar()

const drawerOpen = ref(false)

function openDrawer() {
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
}

async function checkout() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    $q.notify({ type: 'warning', message: 'Сначала войдите в аккаунт' })
    closeDrawer()
    return
  }

  $q.notify({ type: 'positive', message: 'Заказ оформлен!' })
  cartStore.clearCart()
  closeDrawer()
}

function updateQuantity(productId, newQuantity) {
  cartStore.updateQuantity(productId, newQuantity)
}

defineExpose({ openDrawer, closeDrawer })
</script>