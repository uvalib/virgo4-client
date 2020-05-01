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
      store.commit('restore/setURL', fthis.$route.fullPath)
      store.commit('restore/save')
  }
}
</script>