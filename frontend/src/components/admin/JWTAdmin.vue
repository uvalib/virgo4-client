<template>
   <div v-if="systemStore.isDevServer && userStore.isAdmin" class="jwt-admin">
      <h3>JWT Management</h3>
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
         <VirgoButton @click="update">Update JWT</VirgoButton>
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
   border: 1px solid $uva-red-A;
   h3 {
      margin: 0;
      padding: 10px 15px;
      background: $uva-grey-200;
      border-bottom: 1px solid $uva-grey-100;
      font-size: 1.2em;
   }
   .content.form {
      padding: 5px 20px 20px 20px;
      display: flex;
      flex-flow: column;
      justify-content: flex-start;
      textarea {
         border: 1px solid $uva-grey-100;
         padding: 20px;
         border-radius: 5px;
         margin-bottom: 15px;
      }
      button {
         margin: 0;
         display: block;
         width: 100%;
      }
   }
   p {
      background: $uva-red-100;
      padding: 10px;
      border: 1px solid $uva-red-100;
      border-radius: 5px;
      color: $uva-text-color-dark;
   }
}
</style>