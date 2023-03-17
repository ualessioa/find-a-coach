<template>
  <base-card>
    <section>
      <h2>Register as a coach now!</h2>
      <coach-form @save-data="saveData"></coach-form>
    </section>
  </base-card>
</template>

<script>
import CoachForm from '../../components/coach/CoachForm.vue';

export default {
  components: { CoachForm },
  methods: {
    saveData(data) {
      this.$store.dispatch('coaches/addCoachAct', data);
      this.$router.replace('/coaches');
    },
  },
};
</script>
