<template>
  <div v-if="isDevServer && isAdmin" class="jwt-admin">
    <h2>Admin JWT Token Management</h2>
    <p>Modify your jwt token. This could break your session and you may have to log in again.</p>
    <div class="form">
      <textarea aria-label="modify your jwt token" v-model="parsedJWT" rows="20" cols="40"></textarea>
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
      isDevServer: 'system/isDevServer',
      isAdmin: 'user/isAdmin'
    }),
  },
  methods: {
    update() {
      this.$store.dispatch('user/overrideClaims')
    },
  },
}
</script>
<style lang="scss" scoped>
.jwt-admin {
   border: 1px solid  var(--uvalib-red-emergency);
   h2 {
       margin:5px 0 10px 0;
   }
   p {
      background: var(--uvalib-red-lightest);
      padding: 10px;
      border: 1px solid var(--uvalib-red);
      border-radius: 5px;
   }
   .form {
      display: flex;
      justify-content: space-evenly;
      align-items: center;
   }
}
</style>