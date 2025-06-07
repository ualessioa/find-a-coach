import { mount } from '@vue/test-utils';
import BaseCard from './BaseCard.vue';

describe('BaseCard.vue', () => {
  it('renders default slot content', () => {
    const slotContent = '<p>This is card content.</p>';
    const wrapper = mount(BaseCard, {
      slots: {
        default: slotContent,
      },
    });
    expect(wrapper.html()).toContain(slotContent);
  });
});
