<template>
  <div v-if="isDevServer" class="jwt-admin">
    <h2>Admin JWT Token Management</h2>
    <p>Modify your jwt token. This could break your session and you may have to log in again.</p>
    <div class="form">
      <textarea v-model="parsedJWT" rows="20" cols="40"></textarea>
      <V4Button mode='primary' @click="update">Update</V4Button>
    </div>
  </div>
</template>
<script>
import { mapFields } from 'vuex-map-fields';
import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapFields({
        parsedJWT: 'user.parsedJWT',
        authorizing: 'user.authorizing',
    }),
    ...mapGetters({
      isDevServer: 'system/isDevServer'
    }),
  },
  methods: {
    update() {
      this.$store.dispatch('user/overrideClaims')
    },
  },
}
</script>
<style scoped>
.jwt-admin {
  border: 2px solid red !important;
  padding: 5px;
}
.form {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
}
</style>