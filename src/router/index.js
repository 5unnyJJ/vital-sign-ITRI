import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHashHistory('/vital-sign-ITRI/'),
  routes: [
    { path: '/', redirect: '/login' },
    {
      path: '/login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/overview',
      component: () => import('../views/OverviewView.vue')
    },
    {
      path: '/detail/:id',
      component: () => import('../views/DetailView.vue')
    },
    {
      path: '/dashboard',
      component: () => import('../views/DashboardView.vue')
    },
    {
      path: '/posture',
      component: () => import('../views/PostureView.vue')
    },
    {
      path: '/hf',
      component: () => import('../views/HfView.vue')
    },
    {
      path: '/hf/:id',
      component: () => import('../views/HfDetailView.vue')
    },
    {
      path: '/xiao-guanjia',
      component: () => import('../views/XiaoGuanjiaView.vue')
    },
  ]
})
