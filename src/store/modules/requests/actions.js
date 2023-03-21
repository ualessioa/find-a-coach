export default {
  async contactCoach(context, payload) {
    try {
      const newRequest = {
        userEmail: payload.email,
        message: payload.message,
      };
      const response = await fetch(
        `https://vue-find-a-coach-1c546-default-rtdb.europe-west1.firebasedatabase.app/requests/${payload.coachId}.json`,
        {
          method: `POST`,
          body: JSON.stringify(newRequest),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Failed to send request.`);
      }
      newRequest.id = responseData.name;
      newRequest.coachId = payload.coachId;

      context.commit('addRequest', newRequest);
    } catch (error) {
      throw new Error(error.message);
    }
  },
  async fetchRequests(context) {
    try {
      const token = context.rootGetters.token;
      const userId = context.rootGetters.getUserId;
      const response = await fetch(
        `https://vue-find-a-coach-1c546-default-rtdb.europe-west1.firebasedatabase.app/requests/${userId}.json?auth=${token}`
      );
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.messae || `Failed to fetch requests.`);
      }

      const requests = [];

      for (const key in responseData) {
        const request = {
          id: key,
          coachId: userId,
          userEmail: responseData[key].userEmail,
          message: responseData[key].message,
        };

        requests.push(request);
      }

      context.commit('setRequests', requests);
    } catch (error) {
      throw new Error(error.message);
    }
  },
};
