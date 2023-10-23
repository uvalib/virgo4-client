<template>
   <FormKit type="form" id="openurl-article" :actions="false" @submit="submitClicked"
      incompleteMessage="Sorry, not all fields are filled out correctly."
   >
      <FormKit label="Journal Title" type="text" v-model="openurl.title" validation="required"
         id="title" help="Please do not abbreviate title"
      />
      <FormKit label="Article Title" type="text" v-model="openurl.article" validation="required"/>
      <FormKit label="Article Author" type="text" v-model="openurl.author" />
      <FormKit label="Volume" type="text" v-model="openurl.volume" />
      <FormKit label="Issue" type="text" v-model="openurl.issue" />
      <FormKit label="Month" type="text" v-model="openurl.month" />
      <FormKit label="Year" type="text" v-model="openurl.year" placeholder="yyyy" validation="required|date_format:YYYY"/>
      <FormKit label="Pages" type="text" v-model="openurl.pages" validation="required|length:1,25" help="(ex: 1-15)"/>
      <FormKit label="ISSN/ISBN" type="text" v-model="openurl.issn"/>
      <FormKit label="OCLC" type="text" v-model="openurl.oclc"/>
       <FormKit label="Notes or Special Instructions" type="textarea" v-model="openurl.notes" :rows="2"
            help="(ex: color copies)"
      />

      <V4FormActions :hasCancel="true" submitLabel="Submit" submitID="submit-openurl-book"
         :disabled="requestStore.buttonDisabled" @canceled="emit('canceled')"/>
   </FormKit>
</template>

<script setup>
import { storeToRefs } from "pinia"
import { onMounted } from 'vue'
import { useRequestStore } from "@/stores/request"
import { setFocusID } from '@/utils'

const requestStore = useRequestStore()
const { openurl } = storeToRefs(requestStore)

const emit = defineEmits( ['submitted', 'canceled'] )

onMounted(() => {
   setFocusID("title")
})
function submitClicked() {
   emit("submitted")
}
</script>

<style lang="scss" scoped>
</style>
