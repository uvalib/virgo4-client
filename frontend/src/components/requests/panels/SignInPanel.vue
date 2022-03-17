<template>
    <SignIn/>
</template>
<script>
import SignIn from "@/views/SignIn.vue"
export default {
  components: {
    SignIn
  },
  created(){
      this.$store.commit('restore/setURL', this.$route.fullPath)
      this.$store.commit('restore/save')
  }
}
</script>