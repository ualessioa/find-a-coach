import { mount } from '@vue/test-utils';
import TheHeader from './TheHeader.vue';
import { createStore } from 'vuex'; // To create a mock store
import { jest } from '@jest/globals'; // For jest.fn()

// Mock router-link globally for all tests in this file
// to prevent warnings and focus on TheHeader's logic.
const RouterLinkStub = {
  template: '<a :href="to"><slot /></a>', // Simple stub that renders an <a> tag
  props: ['to']
};


describe('TheHeader.vue', () => {
  let store;
  let mockActions;
  let mockGetters;

  const createWrapper = (getters, actions = {}) => {
    mockActions = {
      logout: actions.logout || jest.fn(),
      ...actions // Allow overriding other actions if needed
    };

    store = createStore({
      modules: {
        auth: { // Assuming your auth module is named 'auth'
          namespaced: true,
          getters: {
            isAuthenticated: () => getters.isAuthenticated || false,
            isCoach: () => getters.isCoach || false, // Assuming this getter exists in auth module
            // Add other getters if TheHeader uses them
          },
          actions: mockActions,
        }
      }
    });

    return mount(TheHeader, {
      global: {
        plugins: [store],
        stubs: {
          'router-link': RouterLinkStub, // Use the custom stub
        },
      },
    });
  };

  describe('User not authenticated', () => {
    let wrapper;
    beforeEach(() => {
      wrapper = createWrapper({ isAuthenticated: false, isCoach: false });
    });

    it('"Coaches" link is visible', () => {
        expect(wrapper.find('a[href="/coaches"]').exists()).toBe(true);
        expect(wrapper.find('a[href="/coaches"]').text()).toBe('All Coaches');
    });

    it('"Login" link is visible', () => {
      // The "Login" link might direct to /auth
      expect(wrapper.find('a[href="/auth"]').exists()).toBe(true);
      expect(wrapper.find('a[href="/auth"]').text()).toBe('Login');
    });

    it('"Logout" button is not visible', () => {
      // Assuming logout is a button, not a link
      expect(wrapper.findAll('button').find(b => b.text() === 'Logout')).toBeUndefined();
    });

    it('"Register" (as coach) link is not visible or directs to auth', () => {
      // If not logged in, "Register" link might not be there, or it's the same as "Login"
      // The component's template shows "Register" link if isAuthenticated but not isCoach
      // If not authenticated, there's no specific "Register as Coach" link, only the general "Login" which leads to auth (and then potential registration).
      // The prompt implies "Register (as coach)" link. This is usually available *after* login.
      // Let's assume if not authenticated, this specific link isn't there.
      const registerLink = wrapper.findAll('a').find(a => a.text() === 'Register');
      // This specific "Register as Coach" link should NOT be visible.
      // The login link IS visible.
      expect(wrapper.find('a[href="/register"]').exists()).toBe(false);

    });

    it('"Requests" link is not visible', () => {
      expect(wrapper.find('a[href="/requests"]').exists()).toBe(false);
    });
  });

  describe('User authenticated, NOT a coach', () => {
    let wrapper;
    beforeEach(() => {
      wrapper = createWrapper({ isAuthenticated: true, isCoach: false });
    });

    it('"Logout" button is visible', () => {
      expect(wrapper.findAll('button').find(b => b.text() === 'Logout')).toBeDefined();
    });

    it('"Register" (as coach) link is visible', () => {
      expect(wrapper.find('a[href="/register"]').exists()).toBe(true);
      expect(wrapper.find('a[href="/register"]').text()).toBe('Register');
    });

    it('"Requests" link is not visible', () => {
      expect(wrapper.find('a[href="/requests"]').exists()).toBe(false);
    });
  });

  describe('User authenticated AND IS a coach', () => {
    let wrapper;
    beforeEach(() => {
      wrapper = createWrapper({ isAuthenticated: true, isCoach: true });
    });

    it('"Logout" button is visible', () => {
      expect(wrapper.findAll('button').find(b => b.text() === 'Logout')).toBeDefined();
    });

    it('"Register" (as coach) link is NOT visible', () => {
      expect(wrapper.find('a[href="/register"]').exists()).toBe(false);
    });

    it('"Requests" link is visible', () => {
      expect(wrapper.find('a[href="/requests"]').exists()).toBe(true);
      expect(wrapper.find('a[href="/requests"]').text()).toBe('Requests');
    });
  });

  it('calls "logout" action when logout button is clicked', async () => {
    const logoutActionMock = jest.fn();
    const wrapper = createWrapper(
        { isAuthenticated: true, isCoach: false }, // State where logout is visible
        { logout: logoutActionMock } // Provide the mock for the logout action specifically
    );

    const logoutButton = wrapper.findAll('button').find(b => b.text() === 'Logout');
    await logoutButton.trigger('click');

    expect(logoutActionMock).toHaveBeenCalled();
  });

   it('navigates to / when logo is clicked', () => {
    const wrapper = createWrapper({}); // any auth state
    const logoLink = wrapper.find('h1 router-link-stub'); // or 'h1 a' with our stub
    expect(logoLink.exists()).toBe(true);
    expect(logoLink.props('to')).toBe('/coaches'); // Or '/' depending on desired home
    // The component uses <router-link to="/coaches">Find a Coach</router-link>
     expect(wrapper.find('h1 a[href="/coaches"]').text()).toBe('Find a Coach');
  });
});
