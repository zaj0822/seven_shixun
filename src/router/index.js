import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/create-meeting',
    name: 'createMeeting',
    component: () => import('../views/MeetingCreateView.vue')
  },
  {
    path: '/recordings',
    name: 'recordings',
    component: () => import('../views/RecordingsView.vue')
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
