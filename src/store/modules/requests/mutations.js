export default {
  addRequest(state, payload) {
    console.log(state.requests);
    state.requests.push(payload);
    console.log(state.requests);
  },
  setRequests(state, payload) {
    state.requests = payload;
  },
};
