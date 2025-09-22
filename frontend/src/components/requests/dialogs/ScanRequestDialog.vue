<template>
   <div class="trigger">
      <VirgoButton @click="showClicked('instruction')" label="Request a scan for instruction" />
      <VirgoButton @click="showClicked('research')" label="Request a scan for personal research" />
   </div>
   <Dialog v-model:visible="showDialog" :modal="true" position="top" :draggable="false" header="Scan Request" @show="dialogOpened" @hide="dialogClosed">
      <SignIn v-if="!user.isSignedIn" />
      <template v-else>
         <p v-if="!user.hasIlliad">
            No ILLiad account found.<br />
            To register <a target="_blank" aria-describedby="new-window" href="https://uva.hosts.atlas-sys.com/remoteauth/illiad.dll?Action=10&Form=80" aria-label="Illiad registration">
            please complete this form. <i class='fal fa-external-link-alt'></i></a>
         </p>
         <p v-else-if="user.illiadBlocked">
            Your ILLiad account is blocked.<br />
            Please contact <a href="mailto:4leo@virginia.edu">4leo@virginia.edu</a> for assistance.
         </p>
         <FormKit v-else-if="submitted == false" type="form" ref="scanForm" :actions="false" @submit="submit">
            <div class="scan-use-note" v-if="scan.type == 'Article'">
               Use this form to request a scan for your coursework or personal academic research.
            </div>
            <div v-else class="scan-use-note">
               <div><b>For instructors only: </b></div>
               <div>Use this form to request a scan for distribution to your students through<br />a course management
                  system (Collab, Canvas, etc).</div>
            </div>
            <FormKit v-if="request.optionItems.length > 1" type="select" label="Select the item you want"
               v-model="selectedItem" id="scan-item-sel" placeholder="Select an item"
               :validation-messages="{required: 'Item selection is required.'}" :options="request.optionItems"
               validation="required" @change="itemSelected()" />
            <FormKit label="Book or Journal Title" type="text" v-model="scan.title" validation="required" />
            <FormKit label="Chapter or Article Title" type="text" v-model="scan.chapter" validation="required" />
            <FormKit label="Chapter or Article Author" type="text" v-model="scan.author" validation="required" />
            <FormKit label="Year" type="text" v-model="scan.year" placeholder="yyyy"
               validation="required|date_format:YYYY" />
            <FormKit label="Volume" type="text" v-model="scan.volume" />
            <FormKit label="Issue" type="text" v-model="scan.issue" />
            <FormKit label="Pages" type="text" v-model="scan.pages" validation="required|length:1,25" help="(ex: 1-15)" />
            <FormKit v-if="scan.type=='Article'" label="Notes" type="textarea" v-model="scan.notes" :rows="2" />
            <FormKit v-else label="Course Information" type="textarea" v-model="scan.notes" :rows="2"
               validation="required" />
            <ILLCopyrightNotice :type="scan.type === 'Article' ? 'research' : 'instruction'" />
         </FormKit>
         <ConfirmationPanel v-else />
      </template>
      <template #footer>
         <template v-if="submitted == false && user.isSignedIn">
            <VirgoButton severity="secondary" @click="showDialog=false" label="Cancel"/>
            <VirgoButton label="Submit Request" @click="submit" />
         </template>
         <VirgoButton v-else severity="secondary" id="request-done" @click="showDialog=false" label="Close"/>
      </template>
   </Dialog>
</template>

<script setup>
import { ref,onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import SignIn from "@/views/SignIn.vue"
import ILLCopyrightNotice from '@/components/requests/panels/ILLCopyrightNotice.vue'
import ConfirmationPanel from "@/components/requests/panels/ConfirmationPanel.vue"
import { useRequestStore } from "@/stores/request"
import { useUserStore } from "@/stores/user"
import { useRestoreStore } from "@/stores/restore"
import { useItemStore } from "@/stores/item"
import { useRoute } from "vue-router"
import analytics from '@/analytics'
import { setFocusID } from '@/utils'

const user = useUserStore()
const restore = useRestoreStore()
const request = useRequestStore()
const item = useItemStore()
const route = useRoute()

const selectedItem = ref(null)
const scan = ref({
   barcode: '',
   issn: '',
   type: 'Article',
   title: '',
   chapter: '',
   author: '',
   volume: '',
   issue: '',
   year: '',
   pages: '',
   notes: '',
   library: '',
   location: '',
   callNumber: '',
})

const submitted = ref(false)
const scanForm = ref()
const showDialog = ref(false)

onMounted(()  => {
   // this is called when a page containing this control is loaded. Use it
   // to auto-open a request that was in progress for a signed out user
   if (request.activeRequest == "scanInstruct") {
      scan.value.type = "Instructional"
      showDialog.value = true
   } else if (request.activeRequest == "scanArticle") {
      scan.value.type = "Article"
      showDialog.value = true
   }
})

const showClicked = ((clickedMode) => {
   if (clickedMode == "instruction") {
      scan.value.type = "Instructional"
      request.activeRequest = "scanInstruct"
   } else {
      scan.value.type = "Article"
      request.activeRequest = "scanArticle"
   }

   restore.setActiveRequest( request.activeRequest )
   restore.setURL(route.fullPath)
   restore.save()

   showDialog.value = true
})

const dialogOpened = (() => {
   selectedItem.value = null
   scan.value.barcode = ''
   scan.value.issn = ''
   scan.value.title = ''
   scan.value.chapter = ''
   scan.value.author = ''
   scan.value.volume = ''
   scan.value.issue = ''
   scan.value.year = ''
   scan.value.pages = ''
   scan.value.notes = ''
   scan.value.library = ''
   scan.value.location = ''
   scan.value.callNumber = ''
   submitted.value = false
   if (user.isSignedIn) {
      analytics.trigger('Requests', 'REQUEST_STARTED', "scan")
      if ( request.optionItems.length == 1) {
         selectedItem.value = request.optionItems[0].value
         itemSelected()
         setFocusID("scan-pickup-sel")
      } else {
         setFocusID("scan-item-sel")
      }

      scan.value.title = item.details.header.title
      if (item.details.header.author) {
         scan.value.author = item.details.header.author.value.join(item.details.header.author.separator)
      } else {
         scan.value.author = "Unknown"
      }
      let isbn = item.details.fields.find( f=>f.name=="isbn")
      if (isbn) {
         scan.value.issn = isbn.value.find( i => i.length == 13)
         if (scan.value.issn == "") {
            scan.value.issn = isbn.value[0]
         }
      }

      let pubDate = item.details.fields.find( f=>f.name=="published_date")
      if (pubDate) {
         scan.value.year = pubDate.value
      }
   }
})

const itemSelected = (() => {
   if ( selectedItem.value ) {
      scan.value.barcode = selectedItem.value.barcode
      scan.value.library = selectedItem.value.library
      scan.value.location = selectedItem.value.location
      scan.value.callNumber = selectedItem.value.callNumber
   }
})

const submit = (async () => {
   await request.submitScan( scan.value )
   if ( request.failed == false ) {
      submitted.value = true
   }
})

const dialogClosed = (() =>{
   request.activeRequest = "none"
   restore.setActiveRequest( request.activeRequest )
   restore.save()
})

</script>

<style lang="scss" scoped>
@media only screen and (min-width: 768px) {
   .trigger {
      display: flex;
      flex-flow: row wrap;
      gap: 1rem;
      width: auton;
   }
}
@media only screen and (max-width: 768px) {
   .trigger {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;
   }
}
.scan-use-note {
   padding:5px 0 10px 0;
   font-size: 0.85em;
   border-bottom: 1px solid $uva-grey-100;
}
</style>