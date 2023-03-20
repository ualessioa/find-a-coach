export default {
  addCoach(state, coach) {
    state.coaches.unshift(coach);
  },
  setCoaches(state, payload) {
    state.coaches = payload;
  },
  setFetchTimestamp(state) {
    state.lastFetch = new Date().getTime();
  },
};
