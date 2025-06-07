import requestsModule from './index'; // Assuming your module is in index.js
import { jest } from '@jest/globals';

// Mock Firebase URL if it's from an env variable and used directly
// process.env.VUE_APP_FIREBASE_DB_URL = 'https://mock-db.firebaseio.com';
const FIREBASE_DB_URL = 'https://vue-find-a-coach-1c546-default-rtdb.europe-west1.firebasedatabase.app';

describe('Vuex Requests Module', () => {
  let mockCommit;
  let mockRootGetters;
  let state;

  beforeEach(() => {
    mockCommit = jest.fn();

    // Deep copy initial state for each test
    state = JSON.parse(JSON.stringify(requestsModule.state));

    mockRootGetters = {
      userId: 'test-coach-user-id', // For fetchRequests (coach fetching their requests)
      token: 'test-auth-token',
    };

    global.fetch = jest.fn();
    process.env.VUE_APP_FIREBASE_DB_URL = FIREBASE_DB_URL;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('actions', () => {
    describe('contactCoach', () => {
      const contactPayload = {
        email: 'client@example.com',
        message: 'Hello coach!',
        coachId: 'target-coach-id',
      };
      const mockFirebasePostResponse = {
        name: 'firebase-generated-req-id', // Firebase returns 'name' for POSTed ID
      };

      it('success', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockFirebasePostResponse,
        });

        await requestsModule.actions.contactCoach({ commit: mockCommit }, contactPayload);

        expect(global.fetch).toHaveBeenCalledWith(
          `${FIREBASE_DB_URL}/requests/${contactPayload.coachId}.json`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              userEmail: contactPayload.email, // Module maps 'email' to 'userEmail'
              message: contactPayload.message,
            }),
          })
        );
        expect(mockCommit).toHaveBeenCalledWith('addRequest', {
          id: mockFirebasePostResponse.name,
          coachId: contactPayload.coachId,
          userEmail: contactPayload.email,
          message: contactPayload.message,
        });
      });

      it('failure (response not ok)', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Failed to send request' }),
        });

        try {
          await requestsModule.actions.contactCoach({ commit: mockCommit }, contactPayload);
        } catch (error) {
          expect(error.message).toBe('Failed to send request.'); // Or specific error from module
        }
        expect(mockCommit).not.toHaveBeenCalledWith('addRequest', expect.anything());
      });

      it('failure (fetch throws)', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network issue'));
        try {
          await requestsModule.actions.contactCoach({ commit: mockCommit }, contactPayload);
        } catch (error) {
          expect(error.message).toBe('Network issue');
        }
        expect(mockCommit).not.toHaveBeenCalledWith('addRequest', expect.anything());
      });
    });

    describe('fetchRequests', () => {
      const mockFirebaseRequestsResponse = {
        req1: { userEmail: 'client1@example.com', message: 'Msg1' },
        req2: { userEmail: 'client2@example.com', message: 'Msg2' },
      };
      const expectedTransformedRequests = [
        { id: 'req1', coachId: mockRootGetters.userId, userEmail: 'client1@example.com', message: 'Msg1' },
        { id: 'req2', coachId: mockRootGetters.userId, userEmail: 'client2@example.com', message: 'Msg2' },
      ];

      it('success & data transformation', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockFirebaseRequestsResponse,
        });

        await requestsModule.actions.fetchRequests({ commit: mockCommit, rootGetters: mockRootGetters });

        expect(global.fetch).toHaveBeenCalledWith(
          `${FIREBASE_DB_URL}/requests/${mockRootGetters.userId}.json?auth=${mockRootGetters.token}`
        );
        expect(mockCommit).toHaveBeenCalledWith('setRequests', expectedTransformedRequests);
      });

      it('success with no requests (empty object from Firebase)', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({}), // Firebase returns empty object for no data
        });
        await requestsModule.actions.fetchRequests({ commit: mockCommit, rootGetters: mockRootGetters });
        expect(mockCommit).toHaveBeenCalledWith('setRequests', []);
      });

      it('success with no requests (null from Firebase)', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => null, // Firebase can also return null
        });
        await requestsModule.actions.fetchRequests({ commit: mockCommit, rootGetters: mockRootGetters });
        expect(mockCommit).toHaveBeenCalledWith('setRequests', []);
      });


      it('failure (response not ok)', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Failed to fetch requests' }),
        });

        try {
          await requestsModule.actions.fetchRequests({ commit: mockCommit, rootGetters: mockRootGetters });
        } catch (error) {
          expect(error.message).toBe('Failed to fetch requests.'); // Or specific error
        }
        expect(mockCommit).not.toHaveBeenCalledWith('setRequests', expect.anything());
      });

      it('failure (fetch throws)', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network problem'));
        try {
          await requestsModule.actions.fetchRequests({ commit: mockCommit, rootGetters: mockRootGetters });
        } catch(e) {
            expect(e.message).toBe('Network problem');
        }
        expect(mockCommit).not.toHaveBeenCalledWith('setRequests', expect.anything());
      });
    });
  });

  describe('getters', () => {
    const coachId = 'current-coach-id';
    const localRootGetters = { userId: coachId };

    it('requests: returns filtered requests for the current coach', () => {
      state.requests = [
        { id: 'r1', coachId: coachId, userEmail: 'a@a.com', message: 'Msg A' },
        { id: 'r2', coachId: 'other-coach-id', userEmail: 'b@b.com', message: 'Msg B' },
        { id: 'r3', coachId: coachId, userEmail: 'c@c.com', message: 'Msg C' },
      ];
      const filtered = requestsModule.getters.requests(state, null, null, localRootGetters);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(req => req.coachId === coachId)).toBe(true);
      expect(filtered[0].id).toBe('r1');
      expect(filtered[1].id).toBe('r3');
    });

    it('requests: returns empty array if no requests in state', () => {
      state.requests = [];
      const filtered = requestsModule.getters.requests(state, null, null, localRootGetters);
      expect(filtered).toEqual([]);
    });

    it('requests: returns empty array if no requests match current coachId', () => {
      state.requests = [
        { id: 'r2', coachId: 'other-coach-id', userEmail: 'b@b.com', message: 'Msg B' },
      ];
      const filtered = requestsModule.getters.requests(state, null, null, localRootGetters);
      expect(filtered).toEqual([]);
    });

    it('requests: returns empty array if rootGetters.userId is null', () => {
      state.requests = [
        { id: 'r1', coachId: coachId, userEmail: 'a@a.com', message: 'Msg A' },
      ];
      const filtered = requestsModule.getters.requests(state, null, null, { userId: null });
      expect(filtered).toEqual([]);
    });


    describe('hasRequests', () => {
      // Mock the 'requests' getter itself for these tests for isolation
      let mockRequestsGetter;

      it('returns true if requests getter returns non-empty array', () => {
        mockRequestsGetter = () => [{ id: 'r1' }]; // Mocked output of 'requests' getter
        const localGetters = { requests: mockRequestsGetter() }; // Pass this as the local getters object
        expect(requestsModule.getters.hasRequests(null, localGetters)).toBe(true);
      });

      it('returns false if requests getter returns empty array', () => {
        mockRequestsGetter = () => [];
        const localGetters = { requests: mockRequestsGetter() };
        expect(requestsModule.getters.hasRequests(null, localGetters)).toBe(false);
      });
    });
  });

  describe('mutations', () => {
    it('addRequest', () => {
      const newRequest = { id: 'req123', coachId: 'c1', userEmail: 'test@test.com', message: 'Hi' };
      requestsModule.mutations.addRequest(state, newRequest);
      expect(state.requests).toContainEqual(newRequest);
      expect(state.requests.length).toBe(1);

      const anotherRequest = { id: 'req456', coachId: 'c2', userEmail: 'hello@test.com', message: 'Hello' };
      requestsModule.mutations.addRequest(state, anotherRequest);
      expect(state.requests).toContainEqual(anotherRequest);
      expect(state.requests.length).toBe(2);
    });

    it('setRequests', () => {
      const initialRequests = [{ id: 'oldReq' }];
      state.requests = initialRequests;

      const newRequestsArray = [
        { id: 'newReq1', coachId: 'c1', userEmail: 'new1@test.com', message: 'New1' },
        { id: 'newReq2', coachId: 'c2', userEmail: 'new2@test.com', message: 'New2' },
      ];
      requestsModule.mutations.setRequests(state, newRequestsArray);
      expect(state.requests).toBe(newRequestsArray); // Should be the new array instance
      expect(state.requests).toEqual(newRequestsArray);
    });
  });
});
