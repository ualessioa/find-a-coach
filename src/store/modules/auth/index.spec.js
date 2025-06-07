import authModule from './index'; // Assuming your module is in index.js
import { jest } from '@jest/globals';

// Mock Firebase API Key if it's accessed directly in the module, otherwise not needed here
// process.env.VUE_APP_FIREBASE_API_KEY = 'test-key';

const FIREBASE_API_KEY = 'test-api-key'; // Replace with actual or mock key if needed by module

describe('Vuex Auth Module', () => {
  let mockCommit;
  let mockDispatch;
  let state;

  beforeEach(() => {
    mockCommit = jest.fn();
    mockDispatch = jest.fn();
    state = { ...authModule.state }; // Create a fresh copy of initial state

    // Mock global objects
    global.fetch = jest.fn();
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(), // if used
    };
    global.setTimeout = jest.fn((callback, delay) => {
      // Return a mock timer ID
      return 12345;
    });
    global.clearTimeout = jest.fn();

    // Reset process.env if modified
    process.env.VUE_APP_FIREBASE_API_KEY = FIREBASE_API_KEY;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('actions', () => {
    describe('auth (signup and login)', () => {
      const testPayload = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockSuccessResponse = {
        idToken: 'test-token',
        localId: 'test-user-id',
        expiresIn: '3600', // seconds
      };

      it('signup success', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockSuccessResponse,
        });

        const signupPayload = { ...testPayload, mode: 'signup' };
        await authModule.actions.auth({ commit: mockCommit, dispatch: mockDispatch }, signupPayload);

        expect(global.fetch).toHaveBeenCalledWith(
          `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              email: testPayload.email,
              password: testPayload.password,
              returnSecureToken: true,
            }),
          })
        );
        expect(global.localStorage.setItem).toHaveBeenCalledWith('token', mockSuccessResponse.idToken);
        expect(global.localStorage.setItem).toHaveBeenCalledWith('userId', mockSuccessResponse.localId);
        const expectedExpiration = expect.any(Number); // Check it's a number
        expect(global.localStorage.setItem).toHaveBeenCalledWith('tokenExpiration', expectedExpiration);
        expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), mockSuccessResponse.expiresIn * 1000);
        expect(mockCommit).toHaveBeenCalledWith('setUser', {
          token: mockSuccessResponse.idToken,
          userId: mockSuccessResponse.localId,
        });
        expect(mockDispatch).toHaveBeenCalledWith('autoLogout');
      });

      it('login success', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockSuccessResponse,
        });

        const loginPayload = { ...testPayload, mode: 'login' };
        await authModule.actions.auth({ commit: mockCommit, dispatch: mockDispatch }, loginPayload);

        expect(global.fetch).toHaveBeenCalledWith(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              email: testPayload.email,
              password: testPayload.password,
              returnSecureToken: true,
            }),
          })
        );
        // Assertions for localStorage, setTimeout, setUser commit are same as signup
        expect(global.localStorage.setItem).toHaveBeenCalledWith('token', mockSuccessResponse.idToken);
        expect(global.localStorage.setItem).toHaveBeenCalledWith('userId', mockSuccessResponse.localId);
        expect(global.localStorage.setItem).toHaveBeenCalledWith('tokenExpiration', expect.any(Number));
        expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), mockSuccessResponse.expiresIn * 1000);
        expect(mockCommit).toHaveBeenCalledWith('setUser', {
          token: mockSuccessResponse.idToken,
          userId: mockSuccessResponse.localId,
        });
        expect(mockDispatch).toHaveBeenCalledWith('autoLogout');
      });

      it('signup action calls auth action', async () => {
        const context = { dispatch: mockDispatch };
        await authModule.actions.signup(context, testPayload);
        expect(mockDispatch).toHaveBeenCalledWith('auth', {
            ...testPayload,
            mode: 'signup'
        });
      });

      it('login action calls auth action', async () => {
        const context = { dispatch: mockDispatch };
        await authModule.actions.login(context, testPayload);
        expect(mockDispatch).toHaveBeenCalledWith('auth', {
            ...testPayload,
            mode: 'login'
        });
      });


      it('auth failure (response not ok)', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: { message: 'API Error' } }),
        });

        const loginPayload = { ...testPayload, mode: 'login' };
        try {
          await authModule.actions.auth({ commit: mockCommit, dispatch: mockDispatch }, loginPayload);
        } catch (error) {
          expect(error.message).toBe('API Error');
        }

        expect(global.localStorage.setItem).not.toHaveBeenCalled();
        expect(mockCommit).not.toHaveBeenCalledWith('setUser', expect.anything());
        expect(global.setTimeout).not.toHaveBeenCalled();
      });

      it('auth failure (fetch throws)', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        const loginPayload = { ...testPayload, mode: 'login' };
        try {
          await authModule.actions.auth({ commit: mockCommit, dispatch: mockDispatch }, loginPayload);
        } catch (error) {
          expect(error.message).toBe('Network error');
        }
        expect(global.localStorage.setItem).not.toHaveBeenCalled();
        expect(mockCommit).not.toHaveBeenCalledWith('setUser', expect.anything());
      });
    });

    describe('logout', () => {
      it('logout flow', () => {
        // Mock timerId if it's stored in state for clearTimeout
        state.timer = 12345;
        authModule.actions.logout({ commit: mockCommit, state });

        expect(global.localStorage.removeItem).toHaveBeenCalledWith('token');
        expect(global.localStorage.removeItem).toHaveBeenCalledWith('userId');
        expect(global.localStorage.removeItem).toHaveBeenCalledWith('tokenExpiration');
        expect(global.clearTimeout).toHaveBeenCalledWith(state.timer);
        expect(mockCommit).toHaveBeenCalledWith('setUser', {
          token: null,
          userId: null,
        });
      });
    });

    describe('tryLogin', () => {
      it('valid token in localStorage', () => {
        const token = 'valid-token';
        const userId = 'valid-user-id';
        const futureExpiration = new Date().getTime() + 3600 * 1000; // 1 hour in future
        global.localStorage.getItem.mockImplementation((key) => {
          if (key === 'token') return token;
          if (key === 'userId') return userId;
          if (key === 'tokenExpiration') return futureExpiration.toString();
          return null;
        });

        authModule.actions.tryLogin({ commit: mockCommit, dispatch: mockDispatch });

        expect(mockCommit).toHaveBeenCalledWith('setUser', { token, userId });
        expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), expect.any(Number));
        expect(mockDispatch).toHaveBeenCalledWith('autoLogout');
      });

      it('expired token in localStorage', () => {
        const pastExpiration = new Date().getTime() - 3600 * 1000; // 1 hour in past
        global.localStorage.getItem.mockImplementation((key) => {
          if (key === 'token') return 'expired-token';
          if (key === 'userId') return 'some-user-id';
          if (key === 'tokenExpiration') return pastExpiration.toString();
          return null;
        });
         authModule.actions.tryLogin({ commit: mockCommit, dispatch: mockDispatch });


        // It should call setUser with null to clear any lingering state if token is invalid
        expect(mockCommit).toHaveBeenCalledWith('setUser', { token: null, userId: null });
        expect(global.setTimeout).not.toHaveBeenCalled();
        // autoLogout should not be dispatched if login fails
        expect(mockDispatch).not.toHaveBeenCalledWith('autoLogout');
      });

      it('no token in localStorage', () => {
        global.localStorage.getItem.mockReturnValue(null);
        authModule.actions.tryLogin({ commit: mockCommit, dispatch: mockDispatch });
        // Should not commit setUser if no token/userId found, or commit with nulls
        // Depending on implementation, it might not commit at all or commit nulls.
        // The provided code seems to only commit if token is valid.
        // If the intention is to clear, it should commit null.
        // Based on the provided code, it won't call setUser if token is missing.
        expect(mockCommit).not.toHaveBeenCalledWith('setUser', expect.objectContaining({ token: expect.any(String) }));
         // Let's refine this: if tryLogin is meant to ensure a clean state if no valid token, it *should* commit nulls.
        // Current code in provided snippet doesn't explicitly do this for "no token" case, only for "expired token".
        // For consistency, let's assume it should clear user state if no token.
        // This might require a small adjustment in the source code's tryLogin or this test needs to reflect current behavior.
        // Given typical patterns, if no token, nothing happens, so no setUser.
        expect(mockCommit.mock.calls.some(call => call[0] === 'setUser' && call[1].token !== null)).toBe(false);

        expect(global.setTimeout).not.toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalledWith('autoLogout');
      });
    });

    describe('autoLogout', () => {
        it('autoLogout flow', () => {
          authModule.actions.autoLogout({ commit: mockCommit, dispatch: mockDispatch });
          expect(mockDispatch).toHaveBeenCalledWith('logout');
          expect(mockCommit).toHaveBeenCalledWith('setAutoLogout');
        });
      });
  });

  describe('mutations', () => {
    it('setUser', () => {
      const payload = { token: 'new-token', userId: 'new-user-id' };
      authModule.mutations.setUser(state, payload);
      expect(state.token).toBe(payload.token);
      expect(state.userId).toBe(payload.userId);
      expect(state.didAutoLogout).toBe(false); // Should reset on new user
    });

    it('setAutoLogout', () => {
      authModule.mutations.setAutoLogout(state);
      expect(state.didAutoLogout).toBe(true);
    });

    it('setTimer', () => {
        const timerId = 98765;
        authModule.mutations.setTimer(state, timerId);
        expect(state.timer).toBe(timerId);
    });
  });

  describe('getters', () => {
    it('getUserId', () => {
      state.userId = 'test-id';
      expect(authModule.getters.userId(state)).toBe('test-id');
    });

    it('token', () => {
      state.token = 'test-token';
      expect(authModule.getters.token(state)).toBe('test-token');
    });

    it('isAuthenticated (true)', () => {
      state.token = 'some-token';
      expect(authModule.getters.isAuthenticated(state)).toBe(true);
    });

    it('isAuthenticated (false)', () => {
      state.token = null;
      expect(authModule.getters.isAuthenticated(state)).toBe(false);
    });

    it('didAutoLogout', () => {
      state.didAutoLogout = true;
      expect(authModule.getters.didAutoLogout(state)).toBe(true);
    });
  });
});
