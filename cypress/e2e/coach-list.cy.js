
describe('Coach Listing and Filtering', () => {
  const mockCoaches = {
    c1: { firstName: 'Maximilian', lastName: 'Schwarzmüller', areas: ['frontend', 'backend', 'career'], hourlyRate: 30, description: '...' },
    c2: { firstName: 'Julie', lastName: 'Jones', areas: ['frontend', 'career'], hourlyRate: 30, description: '...' },
    c3: { firstName: 'Manuel', lastName: 'Lorenz', areas: ['frontend', 'backend'], hourlyRate: 35, description: '...' },
  };

  beforeEach(() => {
    // Intercept the request to Firebase and return mock data
    cy.intercept(
      'GET',
      'https://vue-find-a-coach-1c546-default-rtdb.europe-west1.firebasedatabase.app/coaches.json', // Ensure this URL matches your actual Firebase URL
      { body: mockCoaches }
    ).as('getCoaches');
    cy.visit('/coaches');
    cy.wait('@getCoaches'); // Wait for the mocked data to be loaded
  });

  it('should load the coach list page and display initial coaches', () => {
    cy.url().should('include', '/coaches');
    cy.get('h3').should('not.contain', 'No coaches found.');
    cy.get('.card > ul >li').should('have.length', 3); // Expecting 3 coaches from mock

    // Verify Maximilian
    cy.contains('h3', 'Maximilian Schwarzmüller').should('be.visible');
    cy.contains('h3', 'Maximilian Schwarzmüller').closest('li').find('.badge.frontend').should('be.visible');
    cy.contains('h3', 'Maximilian Schwarzmüller').closest('li').find('.badge.backend').should('be.visible');
    cy.get('.card > ul >li').contains('h3', 'Maximilian Schwarzmüller').closest('li').find('.badge.career').should('be.visible');
    cy.contains('h3', 'Maximilian Schwarzmüller').closest('li').should('contain', '$30/h');

    // Verify Julie
    cy.contains('h3', 'Julie Jones').should('be.visible');
    cy.contains('h3', 'Julie Jones').closest('li').find('.badge.frontend').should('be.visible');
    cy.contains('h3', 'Julie Jones').closest('li').find('.badge.career').should('be.visible');
    cy.contains('h3', 'Julie Jones').closest('li').find('.badge.backend').should('not.exist');
    cy.contains('h3', 'Julie Jones').closest('li').should('contain', '$30/h');

    // Verify Manuel
    cy.contains('h3', 'Manuel Lorenz').should('be.visible');
    cy.contains('h3', 'Manuel Lorenz').closest('li').find('.badge.frontend').should('be.visible');
    cy.contains('h3', 'Manuel Lorenz').closest('li').find('.badge.backend').should('be.visible');
    cy.contains('h3', 'Manuel Lorenz').closest('li').find('.badge.career').should('not.exist');
    cy.contains('h3', 'Manuel Lorenz').closest('li').should('contain', '$35/h');
  });

  it('should filter coaches by "Frontend" area', () => {
    cy.get('input#backend').uncheck();
    cy.get('input#career').uncheck();

    cy.get('.filter-option').contains('label', 'Frontend').parent().should('have.class', 'active');
    cy.get('.filter-option').contains('label', 'Backend').parent().should('not.have.class', 'active');
    cy.get('.filter-option').contains('label', 'Career').parent().should('not.have.class', 'active');

    cy.get('.card > ul >li').should('have.length', 3); // All 3 have frontend
    cy.contains('h3', 'Maximilian Schwarzmüller').should('be.visible');
    cy.contains('h3', 'Julie Jones').should('be.visible');
    cy.contains('h3', 'Manuel Lorenz').should('be.visible');
  });

  it('should filter coaches by "Backend" area', () => {
    cy.get('input#frontend').uncheck();
    cy.get('input#career').uncheck();
    cy.get('.filter-option').contains('label', 'Backend').parent().should('have.class', 'active');

    cy.get('.card > ul >li').should('have.length', 2); // Max and Manuel have backend
    cy.contains('h3', 'Maximilian Schwarzmüller').should('be.visible');
    cy.contains('h3', 'Manuel Lorenz').should('be.visible');
    cy.contains('h3', 'Julie Jones').should('not.exist');
  });

  it('should filter coaches by "Career" area', () => {
    cy.get('input#frontend').uncheck();
    cy.get('input#backend').uncheck();
    cy.get('.filter-option').contains('label', 'Career').parent().should('have.class', 'active');

    cy.get('.card > ul >li').should('have.length', 2); // Max and Julie have career
    cy.contains('h3', 'Maximilian Schwarzmüller').should('be.visible');
    cy.contains('h3', 'Julie Jones').should('be.visible');
    cy.contains('h3', 'Manuel Lorenz').should('not.exist');
  });

  it('should show "No coaches found." when all filters are unchecked', () => {
    cy.get('input#frontend').uncheck();
    cy.get('input#backend').uncheck();
    cy.get('input#career').uncheck();

    cy.get('.card > ul >li').should('not.exist');
    cy.get('h3').contains('No coaches found.').should('be.visible');
  });

  it('should show all coaches when a filter is unchecked and then checked again', () => {
    // Initially all checked, 3 coaches
    cy.get('.card > ul >li').should('have.length', 3);

    // Uncheck frontend
    cy.get('input#frontend').uncheck();
    // Expected: Max (backend, career), Manuel (backend) -> Julie is out because she only has frontend and career, and career is still checked.
    // Actually, if only frontend is unchecked, Max (backend, career) and Manuel (backend) should remain. Julie (frontend, career) remains due to career.
    // Let's be more specific: uncheck frontend AND career, leaving only backend
    cy.get('input#career').uncheck();
    // Now only Max and Manuel should be visible due to 'backend'
    cy.get('.card > ul >li').should('have.length', 2);
    cy.contains('h3', 'Maximilian Schwarzmüller').should('be.visible');
    cy.contains('h3', 'Manuel Lorenz').should('be.visible');
    cy.contains('h3', 'Julie Jones').should('not.exist');

    // Re-check frontend
    cy.get('input#frontend').check();
    // Now Max (frontend, backend), Manuel (frontend, backend), Julie (frontend, career) should be visible (career is still unchecked)
    cy.get('.card > ul >li').should('have.length', 3);
    cy.contains('h3', 'Maximilian Schwarzmüller').should('be.visible');
    cy.contains('h3', 'Julie Jones').should('be.visible');
    cy.contains('h3', 'Manuel Lorenz').should('be.visible');
  });
});
