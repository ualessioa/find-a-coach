import { mount } from '@vue/test-utils';
import CoachFilter from './CoachFilter.vue';

describe('CoachFilter.vue', () => {
  it('emits "change-filter" event with correct payload when checkboxes are changed', async () => {
    const wrapper = mount(CoachFilter);

    // Initial state (all true based on component's data)
    // The component initializes filters to all true. Let's simulate unchecking one.
    const expectedInitialFilters = {
      frontend: true,
      backend: true,
      career: true,
    };
    // No event on mount, only on change

    // Simulate unchecking 'frontend'
    const frontendCheckbox = wrapper.find('input[type="checkbox"][id="frontend"]');
    await frontendCheckbox.setChecked(false);

    expect(wrapper.emitted()['change-filter']).toBeTruthy();
    expect(wrapper.emitted()['change-filter'].length).toBe(1);
    expect(wrapper.emitted()['change-filter'][0][0]).toEqual({
      frontend: false,
      backend: true,
      career: true,
    });

    // Simulate checking 'backend' (it's already checked by default, let's uncheck then check)
    const backendCheckbox = wrapper.find('input[type="checkbox"][id="backend"]');
    await backendCheckbox.setChecked(false); // Event 2

    expect(wrapper.emitted()['change-filter'].length).toBe(2);
    expect(wrapper.emitted()['change-filter'][1][0]).toEqual({
      frontend: false, // from previous change
      backend: false,
      career: true,
    });

    await backendCheckbox.setChecked(true); // Event 3
    expect(wrapper.emitted()['change-filter'].length).toBe(3);
    expect(wrapper.emitted()['change-filter'][2][0]).toEqual({
      frontend: false, // from previous change
      backend: true,
      career: true,
    });
  });

  it('initializes with all filters checked', () => {
    const wrapper = mount(CoachFilter);
    expect(wrapper.vm.filters.frontend).toBe(true);
    expect(wrapper.vm.filters.backend).toBe(true);
    expect(wrapper.vm.filters.career).toBe(true);

    expect(wrapper.find('input#frontend').element.checked).toBe(true);
    expect(wrapper.find('input#backend').element.checked).toBe(true);
    expect(wrapper.find('input#career').element.checked).toBe(true);
  });
});
