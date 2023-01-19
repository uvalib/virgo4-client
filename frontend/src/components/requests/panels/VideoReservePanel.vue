<template>
   <div class='course-reserves'>
      <h2>Video Reserve Request</h2>
      <div class="note important">
         Please allow 14 days to process requests.
      </div>
      <FormKit type="form" id="video-request" :actions="false" @submit="submit"
         incompleteMessage="Sorry, not all fields are filled out correctly.">
         <FormKit type="select" label="Is this request on behalf of an instructor?" v-model="reserveRequest.onBehalfOf"
            id="behalf_of" :options="{ no: 'No', yes: 'Yes' }" />
         <template v-if="reserveRequest.onBehalfOf == 'yes'">
            <FormKit label="Instructor Name" type="text" v-model="reserveRequest.instructorName"
               validation="required" />
            <FormKit label="Instructor Email" type="email" v-model="reserveRequest.instructorEmail"
               validation="required" />
         </template>
         <FormKit label="Your Name" type="text" v-model="reserveRequest.name" validation="required" />
         <FormKit label="Your Email" type="email" v-model="reserveRequest.email" validation="required" />
         <FormKit label="Course ID" type="text" v-model="reserveRequest.course" validation="required"
            help="(e.g. MDST 3840)" />
         <FormKit type="select" label="Semester" v-model="reserveRequest.semester" validation="required"
            placeholder="Please select a semester"
            :options="['Fall', 'January', 'Spring', 'Summer I', 'Summer II', 'Summer III']" />
         <FormKit type="select" label="Learning Management System" v-model="reserveRequest.lms" validation="required"
            placeholder="Please select an LMS"
            :options="['A&S Canvas', 'Blackboard', 'Collab', 'Law Canvas', 'Other']" />
         <FormKit v-if="reserveRequest.lms == 'Other'" label="Please specify other LMS" type="text"
            v-model="reserveRequest.otherLMS" validation="required" />

         <div class="video-note">
            All video reserve requests will be delivered as streaming resources to your class’s Learning Management
            System.
            If you have questions about video reserves, please email
            <a href="mailto:lib-reserves@virginia.edu">lib-reserves@virginia.edu</a>.
         </div>
         <FormKit v-if="itemOptions.length > 1" type="select" label="Select the item you want" v-model="selectedVideo"
            placeholder="Select an item" :validation-messages="{ required: 'Item selection is required.' }"
            :options="itemOptions" validation="required" id="scan-select" />
         <template v-if="!streamingReserve">
            <FormKit label="Preferred audio language" type="text" v-model="audioLanguage" />
            <FormKit type="select" label="Include subtitles?" v-model="subtitles" :options="{ no: 'No', yes: 'Yes' }" />
            <FormKit v-if="subtitles == 'yes'" label="Subtitles language" type="text" v-model="subtitleLanguage"
               validation="required" />
         </template>

         <FormKit label="Notes" type="textarea" v-model="notes" :rows="3" />
         <V4FormActions :hasCancel="false" submitLabel="Submit Request" submitID="submit-request"
            :disabled="requestStore.buttonDisabled" />
      </FormKit>
   </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import { useRequestStore } from "@/stores/request"
import { useReserveStore } from "@/stores/reserve"
import { useItemStore } from "@/stores/item"
import { useUserStore } from "@/stores/user"

const requestStore = useRequestStore()
const reserveStore = useReserveStore()
const item = useItemStore()
const user = useUserStore()

const selectedVideo = ref(null)
const audioLanguage = ref("English")
const subtitles = ref("no")
const subtitleLanguage = ref("")
const notes = ref("")

const itemOptions = computed(() => {
   let out = []
   requestStore.activeOption.item_options.forEach( i => {
      out.push( {label: i.label, value: i })
   })
   return out
})
const reserveRequest = computed(() => {
   return reserveStore.request
})
const streamingReserve = computed(() => {
   return requestStore.activeOption.streaming_reserve
})

onMounted(() => {
   reserveStore.clearRequestList()
   reserveStore.setRequestingUser(user.accountInfo)
   if (itemOptions.value.length == 0){
      selectedVideo.value = {}
   } else if (itemOptions.value.length == 1){
      selectedVideo.value = itemOptions.value[0].value
   }
   document.getElementById("behalf_of").focus()
   reserveStore.request.lms = "A&S Canvas"
})

function submit() {
   selectedVideo.value.pool = item.details.source
   selectedVideo.value.catalogKey = item.details.identifier
   selectedVideo.value.title = item.details.header.title
   selectedVideo.value.audioLanguage = audioLanguage.value
   selectedVideo.value.subtitles = subtitles.value
   selectedVideo.value.subtitleLanguage = subtitleLanguage.value
   selectedVideo.value.notes = notes.value
   selectedVideo.value.isVideo = true
   reserveStore.createVideoReserve(selectedVideo.value)
}
</script>

<style lang="scss" scoped>
.course-reserves {
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
   text-align: left;
   width: 50%;
   margin: 0 auto;

   .video-note {
      text-align: left;
      padding: 20px 0;
      font-size: 1.1em;
   }
}

@media only screen and (max-width: 768px) {
   .course-reserves {
      width: 95%;
   }
}
</style>