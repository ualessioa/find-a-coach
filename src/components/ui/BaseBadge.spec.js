import { mount } from '@vue/test-utils';
import BaseBadge from './BaseBadge.vue';

describe('BaseBadge.vue', () => {
  it('renders default slot content (which becomes the title)', () => {
    const titleContent = 'Frontend';
    const wrapper = mount(BaseBadge, {
      slots: {
        default: titleContent,
      },
    });
    // The component internally uses a computed property `text` that converts slot to uppercase
    expect(wrapper.text()).toBe(titleContent.toUpperCase());
  });

  it('renders title prop if slot is not provided', () => {
    const titleProp = 'Backend';
    const wrapper = mount(BaseBadge, {
        props: {
            title: titleProp,
        }
    });
    expect(wrapper.text()).toBe(titleProp.toUpperCase());
  });

  it('slot content takes precedence over title prop', () => {
    const slotContent = 'Career';
    const titleProp = 'ShouldBeOverridden';
    const wrapper = mount(BaseBadge, {
        props: {
            title: titleProp,
        },
        slots: {
            default: slotContent,
        }
    });
    expect(wrapper.text()).toBe(slotContent.toUpperCase());
  });

  describe('class binding based on type prop', () => {
    it('applies "badge--frontend" class for type "frontend"', () => {
      const wrapper = mount(BaseBadge, {
        props: { type: 'frontend' },
        slots: { default: 'test' } // Slot is needed for computed `text`
      });
      expect(wrapper.classes()).toContain('badge--frontend');
    });

    it('applies "badge--backend" class for type "backend"', () => {
      const wrapper = mount(BaseBadge, {
        props: { type: 'backend' },
        slots: { default: 'test' }
      });
      expect(wrapper.classes()).toContain('badge--backend');
    });

    it('applies "badge--career" class for type "career"', () => {
      const wrapper = mount(BaseBadge, {
        props: { type: 'career' },
        slots: { default: 'test' }
      });
      expect(wrapper.classes()).toContain('badge--career');
    });

    it('applies no specific type class if type is not recognized or not provided', () => {
      const wrapper = mount(BaseBadge, {
        props: { type: 'unknown' },
        slots: { default: 'test' }
      });
      expect(wrapper.classes().some(cls => cls.startsWith('badge--'))).toBe(false);

      const wrapperNoType = mount(BaseBadge, {
        slots: { default: 'test' }
      });
      expect(wrapperNoType.classes().some(cls => cls.startsWith('badge--'))).toBe(false);
    });
  });
});
