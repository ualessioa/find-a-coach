import { createRouter, createWebHistory } from 'vue-router';
import CoachList from './Pages/coach/CoachList.vue';
import CoachDetail from './Pages/coach/CoachDetail.vue';
import CoachCreate from './Pages/coach/CoachCreate.vue';
import RequestCreate from './Pages/request/RequestCreate.vue';
import RequestList from './Pages/request/RequestList.vue';
import NotFound from './Pages/NotFound.vue';

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
    { path: '/register', component: CoachCreate },
    { path: '/requests', component: RequestList },
    { path: '/:notFound(.*)', component: NotFound },
  ],
});

export default router;
