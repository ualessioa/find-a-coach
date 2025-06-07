import { mount } from '@vue/test-utils';
import BaseButton from './BaseButton.vue';

describe('BaseButton.vue', () => {
  it('renders default slot content', () => {
    const slotContent = 'Click Me';
    const wrapper = mount(BaseButton, {
      slots: {
        default: slotContent,
      },
    });
    expect(wrapper.text()).toContain(slotContent);
  });

  it('emits click event when clicked', async () => {
    const wrapper = mount(BaseButton);
    await wrapper.trigger('click');
    expect(wrapper.emitted().click).toBeTruthy();
    expect(wrapper.emitted().click.length).toBe(1);
  });

  describe('disabled prop', () => {
    it('button is disabled when prop is true', () => {
      const wrapper = mount(BaseButton, {
        props: {
          disabled: true,
        },
      });
      expect(wrapper.attributes('disabled')).toBeDefined();
    });

    it('button is not disabled when prop is false or default', () => {
      const wrapper = mount(BaseButton, {
        props: {
          disabled: false,
        },
      });
      expect(wrapper.attributes('disabled')).toBeUndefined();
    });

    it('does not emit click event when disabled and clicked', async () => {
      const wrapper = mount(BaseButton, {
        props: {
          disabled: true,
        },
      });
      await wrapper.trigger('click');
      expect(wrapper.emitted().click).toBeFalsy();
    });
  });

  describe('mode prop class bindings', () => {
    it('applies no specific mode class by default', () => {
      const wrapper = mount(BaseButton);
      // Assuming no 'mode' prop means it might have a base class but not 'flat' or 'outline'
      expect(wrapper.classes().some(cls => cls === 'flat' || cls === 'outline')).toBe(false);
    });

    it('applies "flat" class when mode is "flat"', () => {
      const wrapper = mount(BaseButton, {
        props: {
          mode: 'flat',
        },
      });
      expect(wrapper.classes()).toContain('flat');
    });

    it('applies "outline" class when mode is "outline"', () => {
      const wrapper = mount(BaseButton, {
        props: {
          mode: 'outline',
        },
      });
      expect(wrapper.classes()).toContain('outline');
    });
  });

  it('renders as a link when "to" prop is provided', () => {
    const wrapper = mount(BaseButton, {
      props: {
        to: '/some-route'
      },
      global: {
        stubs: ['router-link'] // Stub router-link to avoid warnings and focus on BaseButton
      }
    });
    expect(wrapper.findComponent({ name: 'router-link' }).exists()).toBe(true);
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('renders as a button by default (no "to" prop)', () => {
    const wrapper = mount(BaseButton);
    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'router-link' }).exists()).toBe(false);
  });
});
