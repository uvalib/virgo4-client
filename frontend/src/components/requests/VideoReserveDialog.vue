<template>
   <RequestDialog trigger="Video reserve request" title="Video Reserve Request" request="Submit"
      :show="request.activeRequest=='videoReserve'" :showSubmit="submitted == false" :disabled="request.working"
      @opened="dialogOpened" @closed="dialogClosed" @submit="videoForm.node.submit()"
   >
      <FormKit v-if="submitted == false" type="form" ref="videoForm" :actions="false" @submit="submit">
         <FormKit type="select" label="Is this request on behalf of an instructor?" v-model="reserve.request.onBehalfOf"
            id="behalf_of" :options="{ no: 'No', yes: 'Yes' }" />
         <template v-if="reserve.request.onBehalfOf == 'yes'">
            <FormKit label="Instructor Name" type="text" v-model="reserve.request.instructorName"
               validation="required" />
            <FormKit label="Instructor Email" type="email" v-model="reserve.request.instructorEmail"
               validation="required" />
         </template>
         <FormKit label="Your Name" type="text" v-model="reserve.request.name" validation="required" />
         <FormKit label="Your Email" type="email" v-model="reserve.request.email" validation="required" />
         <FormKit label="Course ID" type="text" v-model="reserve.request.course" validation="required"
            help="(e.g. MDST 3840)" />
         <FormKit type="select" label="Semester" v-model="reserve.request.semester" validation="required"
            placeholder="Please select a semester"
            :options="['Fall', 'January', 'Spring', 'Summer I', 'Summer II', 'Summer III']" />
         <FormKit type="select" label="Learning Management System" v-model="reserve.request.lms" validation="required"
            placeholder="Please select an LMS"
            :options="['A&S Canvas', 'Blackboard', 'Law Canvas', 'Other']" />
         <FormKit v-if="reserve.request.lms == 'Other'" label="Please specify other LMS" type="text"
            v-model="reserve.request.otherLMS" validation="required" />

         <div class="video-note">
            All video reserve requests will be delivered as streaming resources to your class's Learning Management
            System.<br/>
            If you have questions about video reserves, please email
            <a href="mailto:lib-reserves@virginia.edu">lib-reserves@virginia.edu</a>.
         </div>
         <FormKit v-if="request.items.length > 1" type="select" label="Select the item you want"
            v-model="selectedVideo" id="video-sel" placeholder="Select an item"
            :validation-messages="{required: 'Item selection is required.'}"
            :options="request.items" validation="required"
         />
         <template v-if="!streamingReserve">
            <FormKit label="Preferred audio language" type="text" v-model="audioLanguage" />
            <FormKit type="select" label="Include subtitles?" v-model="subtitles" :options="{ no: 'No', yes: 'Yes' }" />
            <FormKit v-if="subtitles == 'yes'" label="Subtitles language" type="text" v-model="subtitleLanguage"
               validation="required" />
         </template>
         <FormKit label="Notes" type="textarea" v-model="notes" :rows="3" />

      </FormKit>
      <ReservedPanel v-else />
   </RequestDialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import RequestDialog from '@/components/requests/RequestDialog.vue'
import ReservedPanel from "@/components/requests/panels/ReservedPanel.vue"
import { useRequestStore } from "@/stores/request"
import { useReserveStore } from "@/stores/reserve"
import { useItemStore } from "@/stores/item"
import { useUserStore } from "@/stores/user"
import { setFocusID } from '@/utils'

const props = defineProps({
   settings: {
      type: Object,
      required: true
   },
})

const request = useRequestStore()
const reserve = useReserveStore()
const item = useItemStore()
const user = useUserStore()

const selectedVideo = ref(null)
const audioLanguage = ref("English")
const subtitles = ref("no")
const subtitleLanguage = ref("")
const notes = ref("")

const submitted = ref(false)
const videoForm = ref()

const streamingReserve = computed(() => {
   return request.option('videoReserve').streaming_reserve
})

const dialogOpened = (() => {
   submitted.value = false
   reserve.clearRequestList()
   reserve.setRequestingUser(user.accountInfo)
   if (request.items.length == 0){
      selectedVideo.value = {}
   } else if (request.items.length == 1){
      selectedVideo.value = request.items[0]
   }
   reserve.request.lms = "A&S Canvas"
   setFocusID("behalf_of")
})

const dialogClosed = (() => {
   request.activeRequest = "none"
})

const submit = (async () => {
   selectedVideo.value.pool = item.details.source
   selectedVideo.value.catalogKey = item.details.identifier
   selectedVideo.value.title = item.details.header.title
   selectedVideo.value.audioLanguage = audioLanguage.value
   selectedVideo.value.subtitles = subtitles.value
   selectedVideo.value.subtitleLanguage = subtitleLanguage.value
   selectedVideo.value.notes = notes.value
   selectedVideo.value.isVideo = true
   request.working = true
   await reserve.createVideoReserve(user.signedInUser, selectedVideo.value)
   request.working = false
   submitted.value = true
})
</script>

<style lang="scss" scoped>
</style>