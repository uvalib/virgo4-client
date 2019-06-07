<template>
   <select :value="value" class="search-term-op"  @input="$emit('input', $event.target.value)">
      <option value="AND">AND</option>
      <option value="OR">OR</option>
   </select>
</template>

<script>
export default {
   props: ["value"],
};
</script>

<style scoped>
</style>
