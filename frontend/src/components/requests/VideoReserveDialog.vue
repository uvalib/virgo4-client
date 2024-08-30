<template>
   <RequestDialog trigger="Video reserve request" title="Video Reserve Request" request="Submit"
      :show="request.activeRequest=='aeon'" :showSubmit="submitted == false" :disabled="request.working"
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
      </FormKit>
      <ReservedPanel v-else />
   </RequestDialog>
</template>

<script setup>
import { ref } from 'vue'
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

const submit = (() => {
   selectedVideo.value.pool = item.details.source
   selectedVideo.value.catalogKey = item.details.identifier
   selectedVideo.value.title = item.details.header.title
   selectedVideo.value.audioLanguage = audioLanguage.value
   selectedVideo.value.subtitles = subtitles.value
   selectedVideo.value.subtitleLanguage = subtitleLanguage.value
   selectedVideo.value.notes = notes.value
   selectedVideo.value.isVideo = true
   reserve.createVideoReserve(selectedVideo.value)
   // FIXME
   submitted.value = true
})
</script>

<style lang="scss" scoped>
</style>