<template>
   <div v-if="systemStore.isDevServer && userStore.isAdmin" class="jwt-admin">
      <h2>JWT Management</h2>
      <div class="content form">
         <p>
            Modify your JWT. This could break your session and you may have to
            log in again.
         </p>
         <textarea
            aria-label="modify your jwt token"
            v-model="userStore.parsedJWT"
            rows="20"
            cols="40"
         ></textarea>
         <V4Button mode="primary" @click="update">Update JWT</V4Button>
      </div>
   </div>
</template>

<script setup>
import { useUserStore } from "@/stores/user"
import { useSystemStore } from "@/stores/system"

const userStore = useUserStore()
const systemStore = useSystemStore()

function update() {
   userStore.overrideClaims()
}
</script>

<style lang="scss" scoped>
.jwt-admin {
   border: 1px solid var(--uvalib-red-emergency);
   h2 {
      margin: 0;
      padding: 10px 15px;
      background: var(--uvalib-grey-lightest);
      border-bottom: 1px solid var(--uvalib-grey-light);
      font-size: 1.2em;
   }
   .content.form {
      padding: 5px 20px 20px 20px;
      display: flex;
      flex-flow: column;
      justify-content: flex-start;
      textarea {
         border: 1px solid var(--uvalib-grey-light);
         padding: 20px;
         border-radius: 5px;
         margin-bottom: 15px;
      }
      button.v4-button {
         margin: 0;
      }
   }
   p {
      background: var(--uvalib-red-lightest);
      padding: 10px;
      border: 1px solid var(--uvalib-red);
      border-radius: 5px;
   }
}
</style>