import { defineRouter } from '#q-app/wrappers'
import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'
import { supabase } from 'src/boot/supabase'

export default defineRouter(() => {
  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createWebHistory(),
  })

  // Глобальная защита маршрутов
  Router.beforeEach(async (to, from, next) => {
    // Получаем сессию перед каждым переходом
    const { data: { session } } = await supabase.auth.getSession()
    const isAuthenticated = !!session

    // Если маршрут требует авторизации, а пользователь не залогинен
    if (to.meta.requiresAuth && !isAuthenticated) {
      next({ name: 'login' })
    } 
    // Если пользователь уже залогинен и пытается зайти на страницу логина
    else if (to.name === 'login' && isAuthenticated) {
      next({ name: 'catalog' })
    }
    // Если пользователь залогинен и пытается зайти на auth/callback (уже после входа)
    else if (to.name === 'auth-callback' && isAuthenticated) {
      next({ name: 'catalog' })
    }
    // В остальных случаях — пропускаем
    else {
      next()
    }
  })

  return Router
})