import { mount } from '@vue/test-utils';
import RequestItem from './RequestItem.vue';

describe('RequestItem.vue', () => {
  const mockRequest = {
    userEmail: 'client@example.com',
    message: 'This is a test request message.',
  };

  let wrapper;

  beforeEach(() => {
    wrapper = mount(RequestItem, {
      props: {
        email: mockRequest.userEmail, // The prop is named 'email' in the component
        message: mockRequest.message,
      },
    });
  });

  it('renders the sender email correctly', () => {
    const emailLink = wrapper.find('a');
    expect(emailLink.exists()).toBe(true);
    expect(emailLink.text()).toBe(mockRequest.userEmail);
  });

  it('renders the message content correctly', () => {
    const messageParagraph = wrapper.find('p');
    expect(messageParagraph.exists()).toBe(true);
    expect(messageParagraph.text()).toBe(mockRequest.message);
  });

  it('formats the email as a "mailto:" link', () => {
    const emailLink = wrapper.find('a');
    expect(emailLink.attributes('href')).toBe(`mailto:${mockRequest.userEmail}`);
  });
});
