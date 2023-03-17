import { createApp } from 'vue';
import App from './App.vue';
import router from './router.js';
import store from './store/store.js';
import BaseCard from './components/UI/BaseCard.vue';
import BaseBadge from './components/UI/BaseBadge.vue';
import BaseButton from './components/UI/BaseButton.vue';

createApp(App)
  .component('BaseCard', BaseCard)
  .component('BaseBadge', BaseBadge)
  .component('BaseButton', BaseButton)
  .use(router)
  .use(store)
  .mount('#app');
