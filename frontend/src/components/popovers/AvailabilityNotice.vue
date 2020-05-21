<template>
   <V4Popover id="availnotice" title="Availability Notice">
      <template v-slot:trigger>
         <i class="icon fas fa-exclamation-triangle"></i>
      </template>
      <template v-slot:content>
         <div class="message">
            <p style="white-space: pre-line;">{{ message }}</p>
         </div>
      </template>
   </V4Popover>
</template>

<script>
export default {
   props: {
      message: String
   },
}
</script>

<style lang="scss" scoped>
.icon {
   color: var(--uvalib-yellow);
}
</style>
