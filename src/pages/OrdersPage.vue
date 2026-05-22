<template>
  <q-page padding>
    <h4>Заказы</h4>

    <q-table
      :rows="orders"
      :columns="columns"
      row-key="id"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from 'boot/supabase'

const orders = ref([])

const columns = [
  { name: 'name', label: 'Имя', field: 'name' },
  { name: 'email', label: 'Email', field: 'email' },
  { name: 'product', label: 'Товар', field: 'product' },
  { name: 'message', label: 'Комментарий', field: 'message' }
]

// загрузка заказов
onMounted(async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')

  console.log('ORDERS:', data)

  if (!error) {
    orders.value = data
  }
})
</script>