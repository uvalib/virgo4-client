<template>
    <SignIn/>
</template>
<script setup>
import SignIn from "@/views/SignIn.vue"
import { onMounted } from "vue"
import { useRestoreStore } from "@/stores/restore"
import { useRoute } from "vue-router"

onMounted(()=>{
  const restore = useRestoreStore()
  const route = useRoute()
  restore.setURL(route.fullPath)
  restore.save()
})
</script>