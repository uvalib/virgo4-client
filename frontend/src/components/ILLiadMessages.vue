<template>
   <div v-if="user.illiadCleared == 'no'" class="illiad-message">
      Your ILLiad account is currently awaiting clearance by ILS staff. You will be notified once your account is active.
   </div>
   <div v-else-if="user.illiadCleared == 'dis'" class="illiad-message">
      Your ILLiad account has been disavowed. This may be due to a change in your UVA status or your affiliation with the UVA Medical Center.
      Please contact ILS staff at <a href="mailto:4leo@virginia.edu">4leo@virginia.edu</a> for assistance.
   </div>
   <div v-else-if="user.illiadCleared == 'b'" class="illiad-message">
      Your ILLiad account is currently blocked. Please contact ILS staff at <a href="mailto:4leo@virginia.edu">4leo@virginia.edu</a> for assistance.
   </div>
   <div v-else-if="user.illiadCleared == 'bo'" class="illiad-message">
      Your ILLiad account is currently blocked due to overdue items on your ILL or circulation account. Please contact ILS staff at <a href="mailto:4leo@virginia.edu">4leo@virginia.edu</a> for assistance.
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