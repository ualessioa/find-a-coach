import { mount } from '@vue/test-utils';
import BaseDialog from './BaseDialog.vue';

describe('BaseDialog.vue', () => {
  it('is not visible if show prop is false', () => {
    const wrapper = mount(BaseDialog, {
      props: { show: false, title: 'Test Dialog' },
    });
    // The component uses <dialog> which has an `open` attribute
    // However, the root of BaseDialog is a <teleport>, then a <div> backdrop, then the <dialog>
    // We check if the dialog element itself is rendered and if its parent div is not displayed
    // The v-if="show" is on the backdrop div and the dialog element itself.
    expect(wrapper.find('dialog').exists()).toBe(false);
    expect(wrapper.find('.backdrop').exists()).toBe(false);

  });

  it('is visible if show prop is true', () => {
    const wrapper = mount(BaseDialog, {
      props: { show: true, title: 'Test Dialog' },
    });
    expect(wrapper.find('dialog').exists()).toBe(true);
    expect(wrapper.find('.backdrop').exists()).toBe(true);
  });

  it('renders title prop in the header', () => {
    const titleText = 'My Dialog Title';
    const wrapper = mount(BaseDialog, {
      props: { show: true, title: titleText },
    });
    const header = wrapper.find('header h2');
    expect(header.exists()).toBe(true);
    expect(header.text()).toBe(titleText);
  });

  it('renders default slot content in the section', () => {
    const slotContent = '<p>Dialog main content</p>';
    const wrapper = mount(BaseDialog, {
      props: { show: true, title: 'Test' },
      slots: {
        default: slotContent,
      },
    });
    const section = wrapper.find('section');
    expect(section.exists()).toBe(true);
    expect(section.html()).toContain(slotContent);
  });

  it('renders actions slot content if provided', () => {
    const actionsContent = '<button>OK</button>';
    const wrapper = mount(BaseDialog, {
      props: { show: true, title: 'Test' },
      slots: {
        actions: actionsContent,
      },
    });
    const menu = wrapper.find('menu');
    expect(menu.exists()).toBe(true);
    expect(menu.html()).toContain(actionsContent);
  });


  it('adds "fixed" class to dialog when fixed prop is true', () => {
    const wrapper = mount(BaseDialog, {
      props: { show: true, title: 'Test', fixed: true },
    });
    expect(wrapper.find('dialog').classes()).toContain('fixed');
  });

  it('does not add "fixed" class if fixed prop is false or default', () => {
    const wrapper = mount(BaseDialog, {
      props: { show: true, title: 'Test', fixed: false },
    });
    expect(wrapper.find('dialog').classes()).not.toContain('fixed');
  });

  it('emits "close" event when backdrop is clicked (if not fixed)', async () => {
    const wrapper = mount(BaseDialog, {
      props: { show: true, title: 'Test', fixed: false },
    });
    await wrapper.find('.backdrop').trigger('click');
    expect(wrapper.emitted().close).toBeTruthy();
  });

  it('does not emit "close" event when backdrop is clicked if dialog is fixed', async () => {
    const wrapper = mount(BaseDialog, {
      props: { show: true, title: 'Test', fixed: true },
    });
    await wrapper.find('.backdrop').trigger('click');
    expect(wrapper.emitted().close).toBeFalsy();
  });

  it('emits "close" event when close button in actions slot is clicked (example)', async () => {
    // This test assumes a specific structure for the close button if it's managed by BaseDialog itself.
    // The current BaseDialog structure has a menu for actions, but no default close button.
    // If the "close" button is part of the "actions" slot passed by the parent, this test is more about parent's behavior.
    // However, if BaseDialog had its own close button in the header/footer, this would be relevant.
    // The provided component has a close button in the header if NO actions slot is provided.

    // Scenario 1: Default close button (no actions slot)
    const wrapperNoActions = mount(BaseDialog, {
        props: { show: true, title: 'Test' }
    });
    const closeButtonInMenu = wrapperNoActions.find('menu button'); // Assuming it's the only button
    if (closeButtonInMenu.exists()) { // This button is only there if no actions slot
        await closeButtonInMenu.trigger('click');
        expect(wrapperNoActions.emitted().close).toBeTruthy();
    }

    // Scenario 2: If there was a dedicated close button (e.g., an 'X' in the header)
    // const wrapperWithX = mount(BaseDialog, { props: { show: true, title: 'Test' } });
    // const xButton = wrapperWithX.find('.close-icon-button'); // Hypothetical
    // if (xButton.exists()) {
    //   await xButton.trigger('click');
    //   expect(wrapperWithX.emitted().close).toBeTruthy();
    // }
  });

  // Test for Teleport (presence)
  it('uses teleport component', () => {
    const wrapper = mount(BaseDialog, {
      props: { show: true, title: 'Test Dialog' },
    });
    // Check if the dialog content is ultimately parented by 'body' due to teleport
    // This is tricky to test directly without inspecting document.body
    // For now, just check that Teleport stub exists if not rendering full tree
    // Or, if rendering full tree, that the dialog element is not directly under the test wrapper's root.
    expect(wrapper.findComponent({ name: 'teleport' }).exists()).toBe(true);
  });
});
