import { mount } from '@vue/test-utils';
import BaseSpinner from './BaseSpinner.vue';

describe('BaseSpinner.vue', () => {
  it('renders the spinner structure', () => {
    const wrapper = mount(BaseSpinner);
    // Check for the presence of the main spinner div and its child divs
    expect(wrapper.find('div.spinner').exists()).toBe(true);
    expect(wrapper.findAll('div.spinner div').length).toBe(12); // Standard CSS spinner often has 12 child elements for blades
  });

  // If BaseSpinner had a v-if or conditional rendering based on a prop,
  // we would test that here. For example:
  // it('is visible when show prop is true', () => {
  //   const wrapper = mount(BaseSpinner, { props: { show: true }});
  //   expect(wrapper.find('div.spinner').exists()).toBe(true);
  // });
  // it('is not visible when show prop is false', () => {
  //   const wrapper = mount(BaseSpinner, { props: { show: false }});
  //   expect(wrapper.find('div.spinner').exists()).toBe(false);
  // });
  // Since the provided BaseSpinner.vue is always visible when included,
  // the first test covers its rendering.
});
