export default {
  addCoachAct(context, coach) {
    context.commit('addCoach', {
      id: context.rootGetters.getUserId,
      firstName: coach.first,
      lastName: coach.last,
      description: coach.desc,
      hourlyRate: coach.rate,
      areas: coach.areas,
    });
  },
};
