import { mount } from '@vue/test-utils';
import CoachForm from './CoachForm.vue';
import BaseButton from '../ui/BaseButton.vue'; // Used by CoachForm

// Mock BaseCard and BaseSpinner if they are complex and not directly relevant to CoachForm's logic
// For this test, we'll assume they render fine or stub them.
// import BaseCard from '../ui/BaseCard.vue';
// import BaseSpinner from '../ui/BaseSpinner.vue';


describe('CoachForm.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(CoachForm, {
      global: {
        components: {
          BaseButton,
          // BaseCard, // If not stubbed
          // BaseSpinner, // If not stubbed
        },
        stubs: {
           // Stubbing children if their internal behavior is not tested here
          'base-card': true,
          'base-spinner': true,
        }
      },
    });
  });

  it('updates firstName data when input changes', async () => {
    const input = wrapper.find('#firstname');
    await input.setValue('John');
    expect(wrapper.vm.firstName.val).toBe('John');
  });

  it('updates lastName data when input changes', async () => {
    const input = wrapper.find('#lastname');
    await input.setValue('Doe');
    expect(wrapper.vm.lastName.val).toBe('Doe');
  });

  it('updates description data when textarea changes', async () => {
    const textarea = wrapper.find('#description');
    await textarea.setValue('A great coach.');
    expect(wrapper.vm.description.val).toBe('A great coach.');
  });

  it('updates hourlyRate data when input changes', async () => {
    const input = wrapper.find('#rate');
    await input.setValue(100);
    expect(wrapper.vm.hourlyRate.val).toBe(100);
  });

  it('updates areas data when checkboxes are changed', async () => {
    const frontendCheckbox = wrapper.find('#frontend');
    const backendCheckbox = wrapper.find('#backend');

    await frontendCheckbox.setChecked(true);
    expect(wrapper.vm.areas.val).toContain('frontend');

    await backendCheckbox.setChecked(true);
    expect(wrapper.vm.areas.val).toContain('backend');
    expect(wrapper.vm.areas.val.length).toBe(2);

    await frontendCheckbox.setChecked(false);
    expect(wrapper.vm.areas.val).not.toContain('frontend');
    expect(wrapper.vm.areas.val).toContain('backend');
    expect(wrapper.vm.areas.val.length).toBe(1);
  });

  it('emits "save-data" event with correct payload on form submission if form is valid', async () => {
    // Set valid data
    await wrapper.vm.firstName.val = 'John';
    await wrapper.vm.lastName.val = 'Doe';
    await wrapper.vm.description.val = 'Description';
    await wrapper.vm.hourlyRate.val = 100;
    await wrapper.vm.areas.val = ['frontend'];

    // Manually trigger validation or ensure formIsValid is true
    wrapper.vm.validateForm(); // Call validateForm to set formIsValid
    expect(wrapper.vm.formIsValid).toBe(true);


    const form = wrapper.find('form');
    await form.trigger('submit.prevent'); // Use submit.prevent if form has .prevent modifier

    expect(wrapper.emitted()['save-data']).toBeTruthy();
    expect(wrapper.emitted()['save-data'].length).toBe(1);
    expect(wrapper.emitted()['save-data'][0][0]).toEqual({
      first: 'John',
      last: 'Doe',
      desc: 'Description',
      rate: 100,
      areas: ['frontend'],
    });
  });

  it('does not emit "save-data" if form is invalid and sets error messages', async () => {
    // Clear default/initial values that might make form valid
    wrapper.vm.firstName.val = ''; // Invalidates first name
    wrapper.vm.validateForm(); // Explicitly call validate form
    expect(wrapper.vm.formIsValid).toBe(false);

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');

    expect(wrapper.emitted()['save-data']).toBeFalsy();

    // Check for error messages based on component's structure
    // Example: if it uses a <p class="invalid"> for firstName
    expect(wrapper.find('.invalid p').exists()).toBe(true); // Assuming generic error message display
    // More specific checks:
    expect(wrapper.vm.firstName.isValid).toBe(false);
    // This depends on how errors are rendered. Let's assume a paragraph for each.
    // This test assumes the form has specific error message display logic tied to `isValid` flags
    // The component uses <p v-if="!firstName.isValid">...</p>
    const errorMessages = wrapper.findAll('p.invalid-message'); // Adjust selector if needed by actual HTML
    // This depends on how the invalid class and message are structured.
    // The component template shows: <p v-if="!firstName.isValid">Firstname must not be empty.</p>
    expect(wrapper.find('p').text()).toContain('Firstname must not be empty.');
  });

  it('displays validation error for empty first name', async () => {
    await wrapper.find('#firstname').setValue('');
    wrapper.vm.validateForm(); // Trigger validation
    expect(wrapper.vm.firstName.isValid).toBe(false);
    expect(wrapper.find('.form-control:has(#firstname) p').text()).toContain('Firstname must not be empty.');
  });

  it('displays validation error for empty description', async () => {
    await wrapper.find('#description').setValue('');
    wrapper.vm.validateForm();
    expect(wrapper.vm.description.isValid).toBe(false);
    expect(wrapper.find('.form-control:has(#description) p').text()).toContain('Description must not be empty.');
  });

  it('displays validation error for negative rate', async () => {
    await wrapper.find('#rate').setValue(-10);
    wrapper.vm.validateForm();
    expect(wrapper.vm.hourlyRate.isValid).toBe(false);
    expect(wrapper.find('.form-control:has(#rate) p').text()).toContain('Rate must be greater than 0.');
  });

  it('displays validation error for no areas selected', async () => {
    // Uncheck all by default (component doesn't pre-check any in its data)
    // If they were checked by default, we'd uncheck them here.
    // wrapper.vm.areas.val = []; // Ensure it's empty
    await wrapper.find('#frontend').setChecked(false); // Assuming default is false
    await wrapper.find('#backend').setChecked(false);
    await wrapper.find('#career').setChecked(false);

    wrapper.vm.validateForm();
    expect(wrapper.vm.areas.isValid).toBe(false);
    expect(wrapper.find('.form-control fieldset + p').text()).toContain('At least one expertise must be selected.');
  });

  it('formIsValid is true when all fields are valid', async () => {
    await wrapper.find('#firstname').setValue('John');
    await wrapper.find('#lastname').setValue('Doe');
    await wrapper.find('#description').setValue('Valid desc');
    await wrapper.find('#rate').setValue(50);
    await wrapper.find('#frontend').setChecked(true);

    wrapper.vm.validateForm();
    expect(wrapper.vm.formIsValid).toBe(true);
  });
});
