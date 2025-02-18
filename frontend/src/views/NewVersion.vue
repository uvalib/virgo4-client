<template>
   <div class="newversion">
      <div class="messages">
         <p>A new version of Virgo is available.</p>
         <div>
            <VirgoButton @click="refreshClicked()" class="update">Update Now</VirgoButton>
         </div>
      </div>
   </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const refreshClicked = (async () => {
   await router.push("/search")
   window.location.reload()
})
</script>

<style scoped>
.newversion {
   min-height: 400px;
   position: relative;
   margin-top: 25px;
}
.messages {
   width:40%;
   margin: 0 auto 30px auto;
   font-size: 1.3em;
}
.update {
   margin-top: 20px;
}
</style>

