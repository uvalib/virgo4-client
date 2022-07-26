<template>
   <FormKit type="form" id="openurl-book" :actions="false" @submit="submitClicked"
      incompleteMessage="Sorry, not all fields are filled out correctly."
   >
      <FormKit label="Title" type="text" v-model="openurl.title" validation="required"
         id="title" help="Please do not abbreviate title"
      />
      <FormKit label="Author/Editor" type="text" v-model="openurl.author"/>
      <FormKit label="Publisher" type="text" v-model="openurl.publisher"/>
      <FormKit label="Volume" type="text" v-model="openurl.volume"/>
      <FormKit label="Year" type="text" v-model="openurl.year" placeholder="yyyy" validation="required|date_format:YYYY"/>
      <FormKit label="Edition" type="text" v-model="openurl.edition"/>
      <FormKit label="ISSN/ISBN" type="text" v-model="openurl.issn"/>
      <FormKit label="OCLC" type="text" v-model="openurl.oclc"/>
      <FormKit label="Need By Date" type="date" v-model="openurl.bydate" validation="required|date_after"/>
      <FormKit label="Cited In" type="text" v-model="openurl.citedin"/>
      <FormKit label="Will you accept the item in a language other than English?" type="radio"
         help="If yes, specify acceptable languages in the notes field."
         v-model="openurl.anylanguage" :options="{'true': 'Yes', 'false': 'No'}"
      />
      <FormKit label="Notes or Special Instructions" type="textarea" v-model="openurl.notes" :rows="2"
            help="(ex: special edition)"
      />
      <FormKit type="select" label="Preferred pickup location" v-model="openurl.pickup"
         placeholder="Select a location"
         :options="pickupLibraries" validation="required"
      />
      <div v-if="openurl.pickup == 'LEO' && (userStore.noILLiadAccount==true || userStore.leoAddress=='')" class="illiad-prompt ra-box ra-fiy">
         It looks like you haven't specified a LEO delivery location yet. Before we can deliver your item, could you please go
         <a href="https://www.library.virginia.edu/services/ils/ill/" target="_blank">here</a> and let us know where you would like your item to be delivered.
      </div>

      <V4FormActions :hasCancel="true" submitLabel="Submit" submitID="submit-openurl-book"
         :disabled="requestStore.buttonDisabled" @canceled="emit('canceled')"/>
   </FormKit>
</template>

<script setup>
import { storeToRefs } from "pinia"
import { onMounted, computed } from 'vue'
import { useRequestStore } from "@/stores/request"
import { useUserStore } from "@/stores/user"
import { usePreferencesStore } from "@/stores/preferences"

const emit = defineEmits( ['submitted', 'canceled'] )

const requestStore = useRequestStore()
const userStore = useUserStore()
const preferences = usePreferencesStore()

const { openurl } = storeToRefs(requestStore)

const pickupLibraries = computed(()=>{
   let out = {}
   userStore.libraries.forEach(l => {
      out[l.id] = l.name
   })
   return out
})

onMounted(()=>{
   openurl.pickup = preferences.pickupLibrary
   document.getElementById("title").focus()
})

function submitClicked() {
   emit("submitted")
}
</script>

<style lang="scss" scoped>
</style>
