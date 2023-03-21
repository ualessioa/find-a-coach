import { createApp, defineAsyncComponent } from 'vue';
import App from './App.vue';
import router from './router.js';
import store from './store/store.js';
import BaseCard from './components/UI/BaseCard.vue';
import BaseBadge from './components/UI/BaseBadge.vue';
import BaseButton from './components/UI/BaseButton.vue';
import BaseSpinner from './components/UI/BaseSpinner.vue';

const BaseDialog = defineAsyncComponent(() =>
  import('./components/UI/BaseDialog.vue')
);

createApp(App)
  .component('BaseCard', BaseCard)
  .component('BaseBadge', BaseBadge)
  .component('BaseButton', BaseButton)
  .component('BaseSpinner', BaseSpinner)
  .component('BaseDialog', BaseDialog)
  .use(router)
  .use(store)
  .mount('#app');
