<template>
   <V4Popover class="source-info" id="whatpop" title="What am I searching?" maxWidth="300px">
      <template v-slot:trigger>
         What am I searching&nbsp;<i class="fas fa-question-circle"></i>
      </template>
      <template v-slot:content>
         Resource Types are collections of related items that are available to be searched by Virgo.
       </template>
   </V4Popover>
</template>

<script>
export default {
}
</script>

<style lang="scss" scoped>
</style>
