describe('Authentication Flows', () => {
  const FIREBASE_API_KEY = Cypress.env('FIREBASE_API_KEY');
  const SIGNUP_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
  const LOGIN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

  const createUniqueUser = () => ({
    email: `testuser-${Date.now()}@example.com`,
    password: 'password123',
    idToken: `mock-id-token-${Date.now()}`,
    localId: `mock-local-id-${Date.now()}`,
    expiresIn: '3600',
  });

  let testUser; // To carry user details between signup and login if needed by a test sequence

  beforeEach(() => {
    cy.window().then((win) => {
      win.sessionStorage.clear();
      win.localStorage.clear();
    });
    // Ensure API key is available
    if (!FIREBASE_API_KEY) {
      throw new Error("Firebase API key is not set. Set CYPRESS_FIREBASE_API_KEY environment variable.");
    }
    testUser = createUniqueUser(); // Fresh user for each test context
  });

  describe('Signup', () => {
    it('should allow a new user to sign up successfully', () => {
      cy.intercept('POST', SIGNUP_URL, {
        statusCode: 200,
        body: {
          idToken: testUser.idToken,
          email: testUser.email,
          localId: testUser.localId,
          expiresIn: testUser.expiresIn,
        },
      }).as('signupRequest');

      // Also intercept the coaches load on redirect
      cy.intercept('GET', '**/coaches.json**', { body: {} }).as('getCoaches');


      cy.visit('/auth');
      cy.get('button').contains('Sign Up Instead').click(); // Switch to signup mode
      cy.get('input#email').type(testUser.email);
      cy.get('input#password').type(testUser.password);
      cy.get('form').find('button').contains('Sign Up').click();

      cy.wait('@signupRequest');
      cy.wait('@getCoaches');


      cy.url().should('include', '/coaches');
      cy.window().its('localStorage.token').should('eq', testUser.idToken);
      cy.window().its('localStorage.userId').should('eq', testUser.localId);
      cy.get('header').find('button').contains('Logout').should('be.visible');
    });

    it('should show an error message if signup email already exists', () => {
      cy.intercept('POST', SIGNUP_URL, {
        statusCode: 400,
        body: {
          error: {
            code: 400,
            message: 'EMAIL_EXISTS',
          },
        },
      }).as('signupRequestError');

      cy.visit('/auth');
      cy.get('button').contains('Sign Up Instead').click();
      cy.get('input#email').type(testUser.email); // Use any email, mock handles the error
      cy.get('input#password').type(testUser.password);
      cy.get('form').find('button').contains('Sign Up').click();

      cy.wait('@signupRequestError');
      cy.get('dialog[open]').should('be.visible');
      cy.get('dialog[open] header h2').should('contain', 'An error occurred');
      cy.get('dialog[open] section p').should('contain', 'EMAIL_EXISTS'); // Or a more user-friendly message
      cy.url().should('include', '/auth');
    });
  });

  describe('Login', () => {
    it('should allow an existing user to log in successfully', () => {
      cy.intercept('POST', LOGIN_URL, {
        statusCode: 200,
        body: {
          idToken: testUser.idToken,
          email: testUser.email,
          localId: testUser.localId,
          expiresIn: testUser.expiresIn,
        },
      }).as('loginRequest');

      cy.intercept('GET', '**/coaches.json**', { body: {} }).as('getCoaches');


      cy.visit('/auth');
      // Login form is shown by default
      cy.get('input#email').type(testUser.email);
      cy.get('input#password').type(testUser.password);
      cy.get('form').find('button').contains('Login').click();

      cy.wait('@loginRequest');
      cy.wait('@getCoaches');

      cy.url().should('include', '/coaches');
      cy.window().its('localStorage.token').should('eq', testUser.idToken);
      cy.window().its('localStorage.userId').should('eq', testUser.localId);
      cy.get('header').find('button').contains('Logout').should('be.visible');
    });

    it('should show an error for login with an invalid password', () => {
      cy.intercept('POST', LOGIN_URL, {
        statusCode: 400,
        body: {
          error: {
            code: 400,
            message: 'INVALID_PASSWORD',
          },
        },
      }).as('loginError');

      cy.visit('/auth');
      cy.get('input#email').type(testUser.email);
      cy.get('input#password').type('wrongpassword');
      cy.get('form').find('button').contains('Login').click();

      cy.wait('@loginError');
      cy.get('dialog[open]').should('be.visible');
      cy.get('dialog[open] section p').should('contain', 'INVALID_PASSWORD');
      cy.url().should('include', '/auth');
    });

    it('should show an error for login with a non-existent email', () => {
      cy.intercept('POST', LOGIN_URL, {
        statusCode: 400,
        body: {
          error: {
            code: 400,
            message: 'EMAIL_NOT_FOUND',
          },
        },
      }).as('loginError');

      cy.visit('/auth');
      cy.get('input#email').type('nonexistent@example.com');
      cy.get('input#password').type('anypassword');
      cy.get('form').find('button').contains('Login').click();

      cy.wait('@loginError');
      cy.get('dialog[open]').should('be.visible');
      cy.get('dialog[open] section p').should('contain', 'EMAIL_NOT_FOUND');
      cy.url().should('include', '/auth');
    });

    it('should show a generic error for other server issues during login', () => {
      cy.intercept('POST', LOGIN_URL, {
        statusCode: 500, // Or any other error code
        body: {
          error: {
            code: 500,
            message: 'INTERNAL_SERVER_ERROR', // Example, could be anything
          },
        },
      }).as('loginError');

      cy.visit('/auth');
      cy.get('input#email').type(testUser.email);
      cy.get('input#password').type(testUser.password);
      cy.get('form').find('button').contains('Login').click();

      cy.wait('@loginError');
      cy.get('dialog[open]').should('be.visible');
      cy.get('dialog[open] section p').should('contain', 'INTERNAL_SERVER_ERROR'); // Or a generic "An error occurred"
      cy.url().should('include', '/auth');
    });
  });

  describe('Logout', () => {
    it('should allow a logged-in user to log out', () => {
      // Setup: Simulate user is logged in by setting localStorage and visiting a page
      cy.window().then((win) => {
        win.localStorage.setItem('token', testUser.idToken);
        win.localStorage.setItem('userId', testUser.localId);
        win.localStorage.setItem('tokenExpiration', Date.now() + 3600 * 1000);
      });

      // Intercept coaches load as app might fetch them on loading an authenticated page
      cy.intercept('GET', '**/coaches.json**', { body: {} }).as('getCoaches');


      cy.visit('/coaches'); // Visit a page that requires auth to show "Logout"
      cy.wait('@getCoaches'); // Ensure page loads and auth state is recognized
      cy.get('header').find('button').contains('Logout').should('be.visible').click();

      cy.url().should('include', '/coaches'); // App redirects to /coaches after logout
      cy.window().its('localStorage.token').should('be.null');
      cy.window().its('localStorage.userId').should('be.null');
      cy.window().its('localStorage.tokenExpiration').should('be.null');
      cy.get('header').find('a[href="/auth"]').contains('Login').should('be.visible');
    });
  });

  describe('Redirection', () => {
    it('should redirect authenticated user visiting /auth to /coaches', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', testUser.idToken);
        win.localStorage.setItem('userId', testUser.localId);
        win.localStorage.setItem('tokenExpiration', Date.now() + 3600 * 1000);
      });

      cy.intercept('GET', '**/coaches.json**', { body: {} }).as('getCoaches');

      cy.visit('/auth');
      // User should be redirected away from /auth
      cy.url().should('not.include', '/auth');
      cy.url().should('include', '/coaches');
      cy.wait('@getCoaches'); // Coaches are fetched on redirect
    });

    it('should redirect unauthenticated user visiting /register to /auth', () => {
      cy.visit('/register');
      cy.url().should('include', '/auth');
      cy.url().should('not.include', '/register');
    });

    it('should redirect unauthenticated user visiting /requests to /auth', () => {
      cy.visit('/requests');
      cy.url().should('include', '/auth');
      cy.url().should('not.include', '/requests');
    });
  });

  // Auto-logout test (conceptual)
  describe('Auto-Logout due to expired token', () => {
    it('should log out user and show message if token is expired on page load/refresh', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'expired-token');
        win.localStorage.setItem('userId', 'some-user-id');
        win.localStorage.setItem('tokenExpiration', Date.now() - 10000); // Token expired 10 seconds ago
      });

      // Intercept coaches load, which will happen if app tries to load main page
      // The app's tryLogin logic should clear the invalid/expired token.
      cy.intercept('GET', '**/coaches.json**', { body: {} }).as('getCoachesEmpty');


      cy.visit('/coaches'); // Visit a page that would normally be for authenticated users

      // After visit, the app's `tryLogin` action should detect the expired token.
      // It should clear localStorage and update the auth state.
      // The UI should reflect a logged-out state.

      cy.window().its('localStorage.token').should('be.null');
      cy.window().its('localStorage.userId').should('be.null');
      cy.window().its('localStorage.tokenExpiration').should('be.null');

      cy.get('header').find('a[href="/auth"]').contains('Login').should('be.visible');

      // Check for a specific auto-logout message if the application implements one.
      // This application's current Vuex store (auth/index.js) sets `didAutoLogout: true`.
      // If a component reacts to this (e.g., BaseDialog showing a message), test for that.
      // For example, if a dialog appears:
      // cy.get('dialog[open] header h2').should('contain', 'Session Expired');
      // cy.get('dialog[open] section p').should('contain', 'You have been automatically logged out.');
      // This part is highly dependent on the app's UI for `didAutoLogout`.
      // The provided code doesn't show a UI reaction to didAutoLogout, so we only check state.
    });
  });

});
