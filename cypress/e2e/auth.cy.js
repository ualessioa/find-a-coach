describe('Authentication Flows', () => {
  // Use a dynamic user object for tests that create users
  // to ensure uniqueness across test runs, especially for signup.
  const createUser = () => ({
    email: `testuser-${Date.now()}@test.com`,
    password: 'password123',
  });

  // Static user for tests that assume a pre-existing user or for login.
  // This user should be created by one of the signup tests if tests depend on each other,
  // or be pre-provisioned if tests are fully independent and hit a live backend.
  // For this suite, we'll make login tests depend on a successful signup from a previous step,
  // or they should handle their own user creation if run in isolation.
  // For simplicity in this example, login will use the details from the last signup.
  // A better approach for independent tests would be programmatic user creation/seeding.
  let testUser = createUser(); // This will be the user for the current suite run.

  beforeEach(() => {
    // Clear session storage or any other client-side storage
    // to ensure a clean state for each test.
    // cy.clearCookies(); // Cypress automatically clears cookies before each test
    cy.window().then((win) => {
      win.sessionStorage.clear();
      win.localStorage.clear();
    });
    // It's good practice to visit the base URL or a known starting point.
    // However, most tests will navigate directly.
  });

  it('should allow a user to sign up', () => {
    const currentUser = createUser(); // Fresh user for signup
    testUser = currentUser; // Update the suite-level user for subsequent tests

    cy.visit('/auth');
    cy.get('button').contains('Sign Up Instead').click();
    cy.get('input#email').type(currentUser.email);
    cy.get('input#password').type(currentUser.password);
    cy.get('form').find('button').contains('Sign Up').click();
    // After sign up, the user is redirected
    cy.url().should('not.include', '/auth');
    cy.url().should('include', '/coaches'); // or '/' which redirects to /coaches
    // Check for logout button to confirm authenticated state
    cy.get('header').find('button').contains('Logout').should('be.visible');
  });

  it('should allow a user to log in with valid credentials', () => {
    // For this test to run independently and correctly,
    // we might need to ensure the user from the previous test exists
    // or sign up a user here if the backend is stateful across tests.
    // For now, assuming the signup test runs first or the user is pre-existing.
    // If tests are truly independent, each test requiring an auth user should perform its own signup.
    // To ensure this test can run independently after a state reset (like clearing DB),
    // we should programmatically ensure the user exists or create it.
    // For this suite, we rely on the signup test to create a user.
    // If running this test in isolation, it would need its own setup.

    cy.visit('/auth');
    cy.get('input#email').type(testUser.email); // Use the user created in the signup test
    cy.get('input#password').type(testUser.password);
    cy.get('form').find('button').contains('Login').click();
    cy.url().should('not.include', '/auth');
    cy.url().should('include', '/coaches');
    cy.get('header').find('button').contains('Logout').should('be.visible');
  });

  it('should show an error message with invalid credentials', () => {
    cy.visit('/auth');
    cy.get('input#email').type('invalid@test.com');
    cy.get('input#password').type('wrongpassword');
    cy.get('form').find('button').contains('Login').click();
    // Check for error message.
    // The dialog title is "An error occurred"
    cy.get('dialog[open]').should('be.visible');
    cy.get('dialog[open]').find('header h2').should('contain', 'An error occurred');
    // The actual error message from Firebase appears in the section (default slot)
    cy.get('dialog[open]').find('section').invoke('text').should('not.be.empty');
    cy.url().should('include', '/auth');
  });

  it('should show an error message for password too short', () => {
    cy.visit('/auth');
    cy.get('input#email').type(testUser.email); // Can use the suite-level testUser here
    cy.get('input#password').type('123'); // Invalid password
    cy.get('form').find('button').contains('Login').click();
    // Check for client-side validation error message
    cy.get('form').should('contain', 'Please enter a valid email and password');
    cy.url().should('include', '/auth');
   });


  it('should redirect unauthenticated users from /register to /auth', () => {
    cy.visit('/register');
    cy.url().should('include', '/auth');
    cy.url().should('not.include', '/register');
  });

  it('should redirect unauthenticated users from /requests to /auth', () => {
    cy.visit('/requests');
    cy.url().should('include', '/auth');
    cy.url().should('not.include', '/requests');
  });

  it('should redirect authenticated users from /auth to /coaches (home)', () => {
    // Log in first using the suite-level testUser
    cy.visit('/auth');
    cy.get('input#email').type(testUser.email);
    cy.get('input#password').type(testUser.password);
    cy.get('form').find('button').contains('Login').click();
    cy.url().should('include', '/coaches'); // ensure login was successful

    // Attempt to visit /auth again
    cy.visit('/auth');
    cy.url().should('not.include', '/auth');
    cy.url().should('include', '/coaches');
  });

  it('should allow a user to log out', () => {
    // Log in first using the suite-level testUser
    cy.visit('/auth');
    cy.get('input#email').type(testUser.email);
    cy.get('input#password').type(testUser.password);
    cy.get('form').find('button').contains('Login').click();
    cy.url().should('include', '/coaches'); // ensure login was successful

    // Logout
    cy.get('header').find('button').contains('Logout').click();
    cy.url().should('not.include', '/requests'); // Should not be on an auth-required page
    cy.url().should('include', '/coaches'); // Redirects to '/' which goes to '/coaches'
    // Verify login button is visible again
    cy.get('header').find('a').contains('Login').should('be.visible');
  });
});
