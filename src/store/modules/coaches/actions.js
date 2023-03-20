export default {
  async addCoachAct(context, coach) {
    try {
      const userId = context.rootGetters.getUserId;
      const coachData = {
        firstName: coach.first,
        lastName: coach.last,
        description: coach.desc,
        hourlyRate: coach.rate,
        areas: coach.areas,
      };

      const response = await fetch(
        `https://vue-find-a-coach-1c546-default-rtdb.europe-west1.firebasedatabase.app/coaches/${userId}.json`,
        {
          method: 'PUT',
          body: JSON.stringify(coachData),
        }
      );

      if (!response.ok) {
        throw new Error();
      }
      // const responseData = await response.json();

      context.commit('addCoach', { ...coachData, id: userId });
    } catch (error) {
      error(error);
    }
  },
  async loadCoaches(context, payload) {
    if (!payload.forceRefresh && !context.getters.shouldUpdate) {
      return;
    }
    try {
      const response = await fetch(
        `https://vue-find-a-coach-1c546-default-rtdb.europe-west1.firebasedatabase.app/coaches.json`
      );

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || `Failed to fetch!`);
      }

      const coaches = [];
      for (const key in responseData) {
        const coach = {
          id: key,
          firstName: responseData[key].firstName,
          lastName: responseData[key].lastName,
          description: responseData[key].description,
          hourlyRate: responseData[key].hourlyRate,
          areas: responseData[key].areas,
        };

        coaches.push(coach);
      }
      context.commit('setCoaches', coaches);
      context.commit('setFetchTimestamp');
    } catch (error) {
      throw new Error(error.message);
    }
  },
};
