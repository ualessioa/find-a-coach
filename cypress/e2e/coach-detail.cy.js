describe('Coach Detail Page', () => {
  const mockCoaches = {
    c1: {
      firstName: 'John',
      lastName: 'Doe',
      areas: ['frontend', 'backend'],
      description: 'A great coach for frontend and backend development.',
      hourlyRate: 100,
    },
    c2: {
      firstName: 'Jane',
      lastName: 'Smith',
      areas: ['career'],
      description: 'Specializes in career coaching.',
      hourlyRate: 120,
    },
  };

  beforeEach(() => {
    cy.intercept('GET', 'https://vue-find-a-coach-1c546-default-rtdb.europe-west1.firebasedatabase.app/coaches.json', {
      body: mockCoaches,
    }).as('getCoaches');

    cy.visit('/coaches');
    cy.wait('@getCoaches');
  });

  it('should navigate to coach detail page and display correct information', () => {
    // Find and click the "View Details" button for the first coach
    cy.get('.card').find('a').contains('View Details').first().click();

    // Verify URL change
    cy.url().should('include', '/coaches/c1');

    // Verify coach's full name
    cy.get('h2').should('contain', 'John Doe');

    // Verify hourly rate
    cy.get('h3').should('contain', '$100/h');

    // Verify areas of expertise (badges)
    cy.get('.badge').should('have.length', 2);
    cy.get('.badge').first().should('contain', 'FRONTEND');
    cy.get('.badge').last().should('contain', 'BACKEND');

    // Verify description
    cy.get('p').should('contain', 'A great coach for frontend and backend development.');

    // Verify "Contact" button link
    cy.get('a').contains('Contact').should('have.attr', 'href', '/coaches/c1/contact');
  });
});
