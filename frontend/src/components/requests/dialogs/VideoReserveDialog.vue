<template>
   <VirgoButton class="trigger" @click="showDialog=true" label="Video reserve request" />
   <Dialog v-model:visible="showDialog" :modal="true" position="top" :draggable="false"
      header="Video Reserve Request" @show="dialogOpened" @hide="dialogClosed"
   >
      <SignIn v-if="!user.isSignedIn" />
      <FormKit v-else-if="submitted == false" type="form" ref="videoForm" :actions="false" @submit="submit">
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
         <FormKit v-if="request.optionItems.length > 1" type="select" label="Select the item you want"
            v-model="selectedVideo" id="video-sel" placeholder="Select an item"
            :validation-messages="{required: 'Item selection is required.'}"
            :options="request.optionItems" validation="required"
         />
         <template v-if="!request.isStreamingReserve">
            <FormKit label="Preferred audio language" type="text" v-model="audioLanguage" />
            <FormKit type="select" label="Include subtitles?" v-model="subtitles" :options="{ no: 'No', yes: 'Yes' }" />
            <FormKit v-if="subtitles == 'yes'" label="Subtitles language" type="text" v-model="subtitleLanguage"
               validation="required" />
         </template>
         <FormKit label="Notes" type="textarea" v-model="notes" :rows="3" />

      </FormKit>
      <ReservedPanel v-else />
      <template #footer>
         <template v-if="submitted == false && user.isSignedIn">
            <VirgoButton severity="secondary" @click="showDialog=false" label="Cancel"/>
            <VirgoButton label="Video reserve request" @click="videoForm.node.submit()" />
         </template>
         <VirgoButton v-else severity="secondary" id="request-done" @click="showDialog=false" label="Close"/>
      </template>
   </Dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import ReservedPanel from "@/components/requests/panels/ReservedPanel.vue"
import SignIn from "@/views/SignIn.vue"
import { useRestoreStore } from "@/stores/restore"
import { useRoute } from "vue-router"
import { useRequestStore } from "@/stores/request"
import { useReserveStore } from "@/stores/reserve"
import { useItemStore } from "@/stores/item"
import { useUserStore } from "@/stores/user"

const request = useRequestStore()
const reserve = useReserveStore()
const item = useItemStore()
const route = useRoute()
const user = useUserStore()
const restore = useRestoreStore()

const showDialog = ref(false)
const selectedVideo = ref(null)
const audioLanguage = ref("English")
const subtitles = ref("no")
const subtitleLanguage = ref("")
const notes = ref("")

const submitted = ref(false)
const videoForm = ref()

onMounted( () => {
   if ( request.activeRequest == "videoReserve") {
      showDialog.value = true
   }
})

const dialogOpened = (() => {
   submitted.value = false
   request.activeRequest = "videoReserve"
   restore.setActiveRequest( request.activeRequest )
   restore.setURL(route.fullPath)
   restore.save()
   if (user.isSignedIn) {
      reserve.clearRequestList()
      reserve.setRequestingUser(user.accountInfo)
      if ( request.optionItems.length == 0){
         selectedVideo.value = {}
      } else if ( request.optionItems.length == 1){
         selectedVideo.value = request.optionItems[0].value
      }
      reserve.request.lms = "A&S Canvas"
   }
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
@media only screen and (min-width: 768px) {
   .trigger {
      width: auto;
   }
}
@media only screen and (max-width: 768px) {
   .trigger {
      width: 100%;
   }
}
</style>