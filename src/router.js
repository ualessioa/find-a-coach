import { createRouter, createWebHistory } from 'vue-router';
import CoachList from './Pages/coach/CoachList.vue';
import CoachDetail from './Pages/coach/CoachDetail.vue';
import CoachCreate from './Pages/coach/CoachCreate.vue';
import RequestCreate from './Pages/request/RequestCreate.vue';
import RequestList from './Pages/request/RequestList.vue';
import UserAuth from './Pages/auth/UserAuth.vue';
import NotFound from './Pages/NotFound.vue';
import store from './store/store.js';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/coaches' },
    { path: '/coaches', component: CoachList },
    {
      path: '/coaches/:id',
      component: CoachDetail,
      //to provide the dinamic id value to the child route
      props: true,
      children: [{ path: 'contact', component: RequestCreate }],
    },
    { path: '/register', component: CoachCreate, meta: { requiresAuth: true } },
    { path: '/requests', component: RequestList, meta: { requiresAuth: true } },
    { path: '/auth', component: UserAuth, meta: { requiresUnauth: true } },
    { path: '/:notFound(.*)', component: NotFound },
  ],
});

router.beforeEach(function (to, _, next) {
  if (to.meta.requiresAuth && !store.getters.isAuthenticated) {
    next('/auth');
  } else if (to.meta.requiresUnauth && store.getters.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;
