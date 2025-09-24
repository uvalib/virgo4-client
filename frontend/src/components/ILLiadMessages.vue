<template>
   <div v-if="user.illiadCleared == 'no'" class="illiad-message">
      Library staff must review your account before you can submit ILL or Scan requests.
   </div>
   <div v-else-if="user.illiadCleared == 'new'" class="illiad-message">
      You must complete your account registration and wait for Library staff to review your account before you can submit ILL or Scan requests.
   </div>
   <div v-else-if="user.illiadCleared == 'dis'" class="illiad-message">
      You are not allowed to submit ILL or Scan requests.
   </div>
   <div v-else-if="user.illiadCleared == 'b'" class="illiad-message">
      Your ILL and Scan request account is currently blocked. Please contact Access Services staff at <a href="mailto:4leo@virginia.edu">4leo@virginia.edu</a>.
   </div>
   <div v-else-if="user.illiadCleared == 'bo'" class="illiad-message">
      Your ILL and Scan request account is currently blocked due to an overdue ILL item. Please contact Access Services staff at <a href="mailto:4leo@virginia.edu">4leo@virginia.edu</a>.
   </div>
   <div v-else class="illiad-message">
         There is a problem with your ILLiad account. Please contact <a href="mailto:4leo@virginia.edu">4leo@virginia.edu</a> for assistance.
   </div>
</template>

<script setup>
import { useUserStore } from "@/stores/user"
const user = useUserStore()
</script>

<style lang="scss" scoped>
div.illiad-message {
   font-size: 1em;
   font-weight: bold;
   text-align: left;
   padding: 0.75rem;
   margin: 15px 0;
   border-radius: 0.3rem;
   color: $uva-text-color-dark;
   background-color: $uva-red-100;
}
</style>