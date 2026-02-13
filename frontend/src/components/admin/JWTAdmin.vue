<template>
   <div v-if="systemStore.isDevServer" class="jwt-admin">
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
   border: 1px solid $uva-grey-100;
   border-top: 0;
   border-radius: 0 0 0.3rem 0.3rem;
   .content.form {
      padding: 5px 20px 20px 20px;
      display: flex;
      flex-flow: column;
      justify-content: flex-start;
      textarea {
         border: 1px solid $uva-grey-100;
         padding: 20px;
         border-radius: 0.3rem;
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
      border-radius: 0.3rem;
      color: $uva-text-color-dark;
   }
}
</style>