import { mount } from '@vue/test-utils';
import CoachItem from './CoachItem.vue';
import BaseBadge from '../ui/BaseBadge.vue'; // CoachItem uses BaseBadge

describe('CoachItem.vue', () => {
  const mockCoach = {
    id: 'c1',
    firstName: 'John',
    lastName: 'Doe',
    rate: 75,
    areas: ['frontend', 'career'],
  };

  let wrapper;

  beforeEach(() => {
    wrapper = mount(CoachItem, {
      props: {
        id: mockCoach.id,
        firstName: mockCoach.firstName,
        lastName: mockCoach.lastName,
        rate: mockCoach.rate,
        areas: mockCoach.areas,
      },
      global: {
        components: {
          BaseBadge, // Register BaseBadge locally or globally if needed by tests
        },
        stubs: {
          'router-link': true, // Stub router-link to avoid Vue Router warnings and focus on component logic
          'base-button': true, // Stub BaseButton if its internal logic is not relevant here
        },
      },
    });
  });

  it('renders coach name correctly', () => {
    expect(wrapper.find('h3').text()).toBe(`${mockCoach.firstName} ${mockCoach.lastName}`);
  });

  it('renders coach hourly rate correctly', () => {
    expect(wrapper.find('h4').text()).toContain(`$${mockCoach.rate}/hour`);
  });

  it('renders correct number of area badges', () => {
    const badges = wrapper.findAllComponents(BaseBadge);
    expect(badges.length).toBe(mockCoach.areas.length);
  });

  it('renders area badges with correct titles/types', () => {
    const badges = wrapper.findAllComponents(BaseBadge);
    mockCoach.areas.forEach((area, index) => {
      // BaseBadge uses slot content for its text, which is then uppercased
      // The 'type' prop is passed directly as the area name
      expect(badges[index].props('type')).toBe(area);
      // The slot content for BaseBadge in CoachItem is the area itself.
      // BaseBadge will uppercase this.
      expect(badges[index].text()).toBe(area.toUpperCase());
    });
  });

  it('computes coachContactLink correctly', () => {
    expect(wrapper.vm.coachContactLink).toBe(`/coaches/${mockCoach.id}/contact`);
  });

  it('computes coachDetailsLink correctly', () => {
    expect(wrapper.vm.coachDetailsLink).toBe(`/coaches/${mockCoach.id}`);
  });

  it('renders "Contact" link with correct "to" attribute', () => {
    // Find router-link stub that contains text "Contact" or has specific class/id
    // The component uses <base-button :to="coachContactLink" mode="outline">Contact</base-button>
    // So we need to find the BaseButton stub that acts as a contact link
    const contactButton = wrapper.findAllComponents({ name: 'base-button' }).find(b => b.text() === 'Contact');
    expect(contactButton.exists()).toBe(true);
    expect(contactButton.props('to')).toBe(wrapper.vm.coachContactLink);
  });

  it('renders "View Details" link with correct "to" attribute', () => {
     // The component uses <base-button :to="coachDetailsLink">View Details</base-button>
    const detailsButton = wrapper.findAllComponents({ name: 'base-button' }).find(b => b.text() === 'View Details');
    expect(detailsButton.exists()).toBe(true);
    expect(detailsButton.props('to')).toBe(wrapper.vm.coachDetailsLink);
  });
});
