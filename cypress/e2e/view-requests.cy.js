describe('Viewing Received Requests', () => {
  let coachUserId;
  let coachUserEmail;
  const coachPassword = 'password123';

  const mockCoachData = {
    // This coachId should match coachUserId once it's generated
    // We'll update this dynamically in beforeEach
    firstName: 'Coach',
    lastName: 'User',
    areas: ['frontend', 'backend'],
    description: 'A testing coach.',
    hourlyRate: 100,
  };

  const mockRequests = {
    req1: { userEmail: 'client1@example.com', message: 'Inquiry about frontend.' },
    req2: { userEmail: 'client2@example.com', message: 'Question about backend sessions.' },
  };

  beforeEach(() => {
    coachUserEmail = `coach-${Date.now()}@example.com`;

    // Programmatically create and log in a user (coach)
    cy.request({
      method: 'POST',
      url: `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${Cypress.env('FIREBASE_API_KEY')}`,
      body: {
        email: coachUserEmail,
        password: coachPassword,
        returnSecureToken: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      coachUserId = response.body.localId;

      // Intercept GET request for coaches to ensure the app knows this user is a coach
      // This makes the "Requests" link visible.
      const dynamicMockCoachData = { ...mockCoachData };
      // Update the key to be the dynamic coachUserId
      cy.intercept('GET', 'https://vue-find-a-coach-1c546-default-rtdb.europe-west1.firebasedatabase.app/coaches.json', {
        body: { [coachUserId]: dynamicMockCoachData },
      }).as('getCoaches');


      // Log the user in via UI
      cy.visit('/auth');
      cy.get('#email').type(coachUserEmail);
      cy.get('#password').type(coachPassword);
      cy.get('button').contains('Login').click();
      cy.url().should('not.contain', '/auth');
      cy.wait('@getCoaches'); // Wait for coach data to load to ensure UI updates (e.g., "Requests" link appears)
    });
  });

  it('should display received requests for a coach', () => {
    // Intercept GET request for this coach's requests
    cy.intercept('GET', `https://vue-find-a-coach-1c546-default-rtdb.europe-west1.firebasedatabase.app/requests/${coachUserId}.json`, {
      body: mockRequests,
    }).as('getRequests');

    // Navigate to the "Received Requests" page
    cy.get('header').find('a[href="/requests"]').click();
    cy.url().should('include', '/requests');

    // Wait for the @getRequests interception
    cy.wait('@getRequests');

    // Verify the page displays a list of requests
    cy.get('.request-item').should('have.length', 2); // Assuming each request has a class 'request-item'

    // Verify details for the first request
    cy.get('.request-item').eq(0).within(() => {
      cy.get('a').should('contain', mockRequests.req1.userEmail); // Assuming email is a mailto link
      cy.get('p').should('contain', mockRequests.req1.message);
    });

    // Verify details for the second request
    cy.get('.request-item').eq(1).within(() => {
      cy.get('a').should('contain', mockRequests.req2.userEmail);
      cy.get('p').should('contain', mockRequests.req2.message);
    });
  });

  it('should display a "no requests" message if there are no requests', () => {
    // Intercept GET request for this coach's requests to return empty
    cy.intercept('GET', `https://vue-find-a-coach-1c546-default-rtdb.europe-west1.firebasedatabase.app/requests/${coachUserId}.json`, {
      body: null, // Or {} depending on how Firebase returns empty data
    }).as('getNoRequests');

    // Navigate to the "Received Requests" page
    cy.get('header').find('a[href="/requests"]').click();
    cy.url().should('include', '/requests');

    // Wait for the @getNoRequests interception
    cy.wait('@getNoRequests');

    // Verify the "no requests" message is displayed
    // The selector and text depend on the application's implementation
    cy.get('h3').should('contain', "You haven't received any requests yet!"); // Or similar text
    // Or, if it's a paragraph: cy.get('p').should('contain', 'No requests found.');

    // Verify that no request items are listed
    cy.get('.request-item').should('not.exist');
  });

  // Optional: afterEach to clean up the user if necessary
});
