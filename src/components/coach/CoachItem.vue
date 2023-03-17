<template>
  <li>
    <h3>{{ fullName }}</h3>
    <h4>${{ rate }}/hour</h4>
    <div>
      <base-badge
        :title="area"
        :type="area"
        v-for="area in areas"
        :key="area"
      ></base-badge>
    </div>
    <div class="actions">
      <base-button mode="outline" link :to="detailsPath"
        >View Details</base-button
      >
      <base-button link :to="contactPath">Contact</base-button>
    </div>
  </li>
</template>

<script>
export default {
  props: ['firstName', 'lastName', 'rate', 'areas', 'id'],
  computed: {
    fullName() {
      return this.firstName + ` ` + this.lastName;
    },
    contactPath() {
      return this.$route.path + '/' + this.id + '/contact';
    },
    detailsPath() {
      return this.$route.path + '/' + this.id;
    },
  },
};
</script>

<style scoped>
li {
  margin: 1rem 0;
  border: 1px solid #424242;
  border-radius: 12px;
  padding: 1rem;
}

h3 {
  font-size: 1.5rem;
}

h3,
h4 {
  margin: 0.5rem 0;
}
div {
  margin: 0.5rem 0;
}

.actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
</style>
