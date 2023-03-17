<template>
  <base-card>
    <section>
      <h2>Register as a coach now!</h2>
      <coach-form></coach-form>
    </section>
  </base-card>
</template>

<script>
import CoachForm from '../../components/coach/CoachForm.vue';

export default {
  components: { CoachForm },
};
</script>
