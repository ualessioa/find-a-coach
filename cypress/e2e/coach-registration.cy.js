describe('Coach Registration', () => {
  let testUserId;
  let testUserEmail;
  let testUserPassword;

  beforeEach(() => {
    // Create a dynamic user for this test
    testUserEmail = `test-${Date.now()}@example.com`;
    testUserPassword = 'password123';

    // Programmatically log in a user (adapted from potential auth.cy.js logic)
    cy.request({
      method: 'POST',
      url: `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${Cypress.env('FIREBASE_API_KEY')}`,
      body: {
        email: testUserEmail,
        password: testUserPassword,
        returnSecureToken: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      testUserId = response.body.localId;
      // Store token if your app uses it for subsequent requests, e.g., localStorage
      // localStorage.setItem('userToken', response.body.idToken);
      // localStorage.setItem('userId', testUserId);


      // Intercept GET request for coaches to simulate user is not yet a coach
      cy.intercept('GET', `https://vue-find-a-coach-1c546-default-rtdb.europe-west1.firebasedatabase.app/coaches.json`, (req) => {
        // Check if the request has already been aliased by a more specific intercept below
        // This is to handle the case where we want to verify the new coach is listed AFTER registration
        if (req.alias !== 'getCoachesAfterRegistration') {
          req.reply({ body: {} });
        }
      }).as('getCoachesInitial');


      // Intercept PUT request for coach registration
      cy.intercept('PUT', `https://vue-find-a-coach-1c546-default-rtdb.europe-west1.firebasedatabase.app/coaches/${testUserId}.json`, (req) => {
        req.reply({
          statusCode: 200,
          body: req.body, // Echo back the request body
        });
      }).as('registerCoach');

      // Visit a page that requires login to set up app state, then navigate
      // For this app, login is handled via the /auth page then redirect
      cy.visit('/auth');
      cy.get('#email').type(testUserEmail);
      cy.get('#password').type(testUserPassword);
      cy.get('button').contains('Login').click();
      cy.url().should('not.contain', '/auth'); // Wait for redirect after login
      cy.wait('@getCoachesInitial'); // Ensure initial coach data (empty for this user) is loaded
    });
  });

  it('should allow a logged-in user to register as a coach and see their listing', () => {
    // Navigate to the coach registration page
    // Assuming there's a "Register" link/button in the header for users who are not coaches
    cy.get('header').find('a[href="/register"]').click();
    cy.url().should('include', '/register');

    // Fill in the coach registration form
    cy.get('#firstname').type('Test');
    cy.get('#lastname').type('CoachReg');
    cy.get('#description').type('Experienced in test automation');
    cy.get('#rate').type('75');

    // Select areas of expertise
    cy.get('#frontend').check();
    cy.get('#career').check();

    // Click the "Register" button
    cy.get('form').find('button').contains('Register').click();

    // Wait for the registration PUT request
    cy.wait('@registerCoach').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.request.body.firstName).to.eq('Test');
      expect(interception.request.body.lastName).to.eq('CoachReg');
      expect(interception.request.body.description).to.eq('Experienced in test automation');
      expect(interception.request.body.hourlyRate).to.eq(75);
      expect(interception.request.body.areas).to.deep.equal(['frontend', 'career']);
    });

    // Verify redirection to /coaches page
    cy.url().should('include', '/coaches');

    // Setup intercept for coaches list to now include the newly registered coach
    const newCoachData = {
      [testUserId]: {
        firstName: 'Test',
        lastName: 'CoachReg',
        description: 'Experienced in test automation',
        hourlyRate: 75,
        areas: ['frontend', 'career'],
      }
    };
    cy.intercept('GET', `https://vue-find-a-coach-1c546-default-rtdb.europe-west1.firebasedatabase.app/coaches.json`, {
      body: newCoachData,
    }).as('getCoachesAfterRegistration');

    // Reload or wait for the page to fetch coaches again if it doesn't auto-refresh
    // In many SPAs, a navigation might trigger this. If not, a cy.reload() might be needed.
    // For this app, navigating to /coaches should trigger a fetch.
    cy.visit('/coaches'); // Re-visiting to ensure fresh data load with the new intercept
    cy.wait('@getCoachesAfterRegistration');


    // Verify the new coach is visible on the coach list page
    cy.get('.coach-overview').should('have.length', 1);
    cy.contains('h3', 'Test CoachReg').should('be.visible');
    cy.contains('p', 'Experienced in test automation').should('be.visible');
    cy.contains('.coach-overview', '$75/hour').should('be.visible');
    cy.get('.coach-overview').first().find('.badge').should('have.length', 2);
    cy.get('.coach-overview').first().find('.badge').contains('FRONTEND').should('be.visible');
    cy.get('.coach-overview').first().find('.badge').contains('CAREER').should('be.visible');


    // Ensure "Register" (as coach) link is no longer visible
    cy.get('header').find('a[href="/register"]').should('not.exist');

    // Optional: Check for a "View Requests" or similar coach-specific link
    // This depends on the application's exact behavior after becoming a coach.
    // cy.get('header').find('a[href="/requests"]').should('be.visible');
  });

  afterEach(() => {
    // Clean up the created user (optional, but good practice for test isolation)
    // This requires knowing how to delete users from Firebase Auth, possibly via a custom task or API call
    // For simplicity, this is omitted here but should be considered for a real test suite.
    // Example (conceptual, would need Firebase Admin SDK or direct REST API call with proper auth):
    // cy.task('deleteFirebaseUser', testUserId);
  });
});
