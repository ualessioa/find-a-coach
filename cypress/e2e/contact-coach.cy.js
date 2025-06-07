describe('Contact Coach and Request Creation', () => {
  let loggedInUserId;
  let loggedInUserEmail;
  const coachId1 = 'c1'; // Using a simple ID for the mock coach

  const mockCoachC1 = {
    firstName: 'Carlos',
    lastName: 'Ray',
    areas: ['frontend', 'consulting'],
    description: 'Experienced Frontend Developer and Consultant.',
    hourlyRate: 150,
  };

  beforeEach(() => {
    loggedInUserEmail = `user-${Date.now()}@example.com`;
    const password = 'password123';

    // Programmatically create and log in a user
    cy.request({
      method: 'POST',
      url: `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${Cypress.env('FIREBASE_API_KEY')}`,
      body: {
        email: loggedInUserEmail,
        password: password,
        returnSecureToken: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      loggedInUserId = response.body.localId;
      // Assuming token/userId might be stored in localStorage or handled by the app's auth state
      // localStorage.setItem('token', response.body.idToken);
      // localStorage.setItem('userId', loggedInUserId);

      // Intercept GET request for all coaches
      cy.intercept('GET', 'https://vue-find-a-coach-1c546-default-rtdb.europe-west1.firebasedatabase.app/coaches.json', {
        body: { [coachId1]: mockCoachC1 },
      }).as('getCoaches');

      // Intercept GET request for specific coach details
      cy.intercept('GET', `https://vue-find-a-coach-1c546-default-rtdb.europe-west1.firebasedatabase.app/coaches/${coachId1}.json`, {
        body: mockCoachC1,
      }).as('getCoachDetail');

      // Intercept POST request for sending a message/request to the coach
      cy.intercept('POST', `https://vue-find-a-coach-1c546-default-rtdb.europe-west1.firebasedatabase.app/requests/${coachId1}.json`, (req) => {
        req.reply({
          statusCode: 200, // Or 201
          body: { name: 'mockRequestId', ...req.body }, // Firebase often returns a name field for new POSTs
        });
      }).as('sendRequest');

      // Log the user in via UI
      cy.visit('/auth');
      cy.get('#email').type(loggedInUserEmail);
      cy.get('#password').type(password);
      cy.get('button').contains('Login').click();
      cy.url().should('not.contain', '/auth'); // Wait for redirect
      cy.wait('@getCoaches'); // Ensure coaches are loaded on the landing page after login
    });
  });

  it('should allow a user to contact a coach and send a request', () => {
    // Visit the coaches page (might already be there after login)
    cy.visit('/coaches');
    cy.wait('@getCoaches'); // ensure coaches are loaded

    // Click on "View Details" for the mock coach
    // Assuming there's only one coach card due to the intercept
    cy.get('.coach-overview').first().find('a').contains('View Details').click();

    // Verify URL changed to the coach's detail page
    cy.url().should('include', `/coaches/${coachId1}`);
    cy.wait('@getCoachDetail'); // Wait for coach details to load

    // Click the "Contact" button on the detail page
    cy.get('.actions').find('a').contains('Contact').click();
    // Or, if it's a button: cy.get('button').contains('Contact').click();


    // Verify URL is correct for the contact page
    cy.url().should('include', `/coaches/${coachId1}/contact`);

    // Fill in the contact form
    // Email might be pre-filled, verify if necessary
    cy.get('#email').should('have.value', loggedInUserEmail); // Assuming it's pre-filled
    // Or type if not: cy.get('#email').type(loggedInUserEmail);

    const messageText = "Hello Coach Carlos, I'd like to schedule a session regarding frontend development.";
    cy.get('#message').type(messageText);

    // Click the "Send Message" button
    cy.get('form').find('button').contains('Send Message').click();

    // Wait for the @sendRequest interception
    cy.wait('@sendRequest').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.request.body.userEmail).to.eq(loggedInUserEmail); // Or 'email' depending on app's model
      expect(interception.request.body.message).to.eq(messageText);
    });

    // Verify redirection (e.g., back to coaches list or detail page)
    // This depends on the application's flow.
    // For this example, let's assume it redirects to the main coaches listing.
    cy.url().should('include', '/coaches');
    cy.url().should('not.include', '/contact'); // Ensure we've left the contact page


    // Check for a success/confirmation message (if any)
    // This is highly application-specific.
    // cy.get('.notification').should('contain', 'Request sent successfully!');
    // Or, if it's a toast that disappears, you might need to be quick or adjust test strategy.

    // As an alternative to checking a global notification,
    // we can check if the user is redirected and the UI is in a consistent state.
    cy.contains('h2', 'Find your Coach').should('be.visible'); // Assuming this is on /coaches
  });

  // Optional: afterEach to clean up the user if necessary
});
