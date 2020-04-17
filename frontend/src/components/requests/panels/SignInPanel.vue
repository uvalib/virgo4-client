<template>
    <SignIn/>
</template>
<script>
import SignIn from '@/views/SignIn';
export default {
  components: {
    SignIn
  },
  created(){
      this.$store.dispatch('restore/save', this.$route.fullPath, {root: true})
  }
}
</script>