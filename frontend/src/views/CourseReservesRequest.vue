<template>
   <V4Spinner  v-if="reserveStore.working" message="Submitting your request..." v-bind:overlay="true"/>
   <ReservedPanel v-if="reserveStore.submitted" />
   <div v-else class="course-reserves-request">
      <div v-if="reserveStore.requestList.length==0" class="no-reserves">
         <p>You currently have no items selected for course reserves.</p>
         <p>
            Please return to your <router-link to="/bookmarks">bookmarks</router-link>
            list and select items to be reserved.
         </p>
      </div>
      <div v-else class="reserves-content">
         <div class="note important">
            Please allow 14 days to process requests
         </div>
         <div class="note">
            If you need to recommend a purchase or have a personal copy to place on reserve,<br/>please click 'Submit Request' and follow the links on the next page.
         </div>
         <FormKit type="form" id="video-request" :actions="false" @submit="submitRequest"
            incompleteMessage="Sorry, not all fields are filled out correctly.">
            <div class="narrow">
               <FormKit type="select" label="Is this request on behalf of an instructor?" v-model="request.onBehalfOf"
                  id="behalf_of" :options="{ no: 'No', yes: 'Yes' }" />
               <template v-if="request.onBehalfOf == 'yes'">
                  <FormKit label="Instructor Name" type="text" v-model="request.instructorName"
                     validation="required" />
                  <FormKit label="Instructor Email" type="email" v-model="request.instructorEmail"
                     validation="required" />
               </template>
               <FormKit label="Your Name" type="text" v-model="request.name" validation="required" />
               <FormKit label="Your Email" type="email" v-model="request.email" validation="required" />
               <FormKit label="Course ID" type="text" v-model="request.course" validation="required"
                  help="(e.g. MDST 3840)" />
               <FormKit type="select" label="Semester" v-model="request.semester" validation="required"
                  placeholder="Please select a semester"
                  :options="['Fall', 'January', 'Spring', 'Summer I', 'Summer II', 'Summer III']" />
               <FormKit type="select" label="Learning Management System" v-model="request.lms" validation="required"
                  placeholder="Please select an LMS"
                  :options="['A&S Canvas', 'Blackboard', 'Collab', 'Education Canvas', 'Law Canvas', 'SCPS/ISSP Canvas', 'Other']" />
               <FormKit v-if="request.lms == 'Other'" label="Please specify other LMS" type="text"
                  v-model="request.otherLMS" validation="required" />

               <div class="video-note">
                  All video reserve requests will be delivered as streaming resources to your class’s Learning Management
                  System.
                  If you have questions about video reserves, please email
                  <a href="mailto:lib-reserves@virginia.edu">lib-reserves@virginia.edu</a>.
               </div>
            </div>

            <div class="items">
               <h3>Items to be placed on reserve</h3>
               <div class="list">
                  <div class="card" v-for="item in videoRequests" :key="item.identifier">
                     <div class="title">{{item.details.title}}</div>
                     <div class="author">{{item.details.author}}</div>
                     <FormKit label="Preferred audio language" type="text" v-model="item.audioLanguage" />
                     <FormKit type="select" label="Include subtitles?" v-model="item.subtitles" :options="{ no: 'No', yes: 'Yes' }" />
                     <FormKit v-if="item.subtitles == 'yes'" label="Subtitles language"
                        type="text" v-model="item.subtitleLanguage" validation="required" />
                     <FormKit label="Notes" type="textarea" v-model="item.notes" :rows="3" />
                  </div>
               </div>
            </div>

            <V4FormActions :hasCancel="true" cancelLabel="Cancel Request" @canceled="cancelRequest"
               submitLabel="Submit Request" submitID="video-request-submit"/>
         </FormKit>
      </div>
   </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import ReservedPanel from "@/components/requests/panels/ReservedPanel.vue"
import { useReserveStore } from '@/stores/reserve'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { storeToRefs } from "pinia"

const router = useRouter()
const userStore = useUserStore()
const reserveStore = useReserveStore()

const { request } = storeToRefs(reserveStore)

const videoRequests = computed(()=>{
   return reserveStore.requestList.filter( r=> r.video === true)
})
onMounted(()=>{
   reserveStore.submitted = false
   reserveStore.setRequestingUser(userStore.accountInfo)
   reserveStore.request.lms = "A&S Canvas"
})

function cancelRequest() {
   router.push("/bookmarks")
}
function submitRequest() {
   reserveStore.createReserves()
}
</script>

<style lang="scss" scoped>
.no-reserves {
   width: 50%;
   min-height: 250px;
   text-align: center;
   margin: 50px auto;
   font-size: 1.2em;
   p {
      margin: 10px 0;
   }
}
.reserves-content {
   margin: 0 auto;
   min-height: 250px;
   text-align: left;
   .important {
      font-weight: bold;
   }
   .note {
      text-align: center;
      margin: 10px 0;
   }
   .video-note {
      font-weight: bold;
      margin: 15px 0;
      text-align: left;
      padding: 10px 10px 0 10px;
   }
   .narrow {
      width: 60%;
      margin: 25px auto 0 auto;
   }
   div.items {
      border: 1px solid var(--uvalib-grey-light);
      margin-top: 35px;
      h3 {
         padding: 5px 10px;
         background-color: var(--uvalib-grey-lightest);
         font-weight: bold;
         margin:0;
         font-size: 1em;
         border-bottom: 1px solid var(--uvalib-grey-light);
      }
      .list {
         display: flex;
         flex-flow: row wrap;
         align-items: flex-start;
         justify-content: center;
         padding: 15px;
      }

      div.card {
         text-align: left;
         padding: 10px;
         font-size: 0.8em;
         border: 1px solid var(--uvalib-grey-light);
         margin: 10px;
         display: inline-block;
         max-width: 275px;
         background: white;
         flex-grow: 1;
      }
      div.card .title {
         font-size:1.1em;
         font-weight: bold;
      }
      div.card .author {
         margin: 5px 0 10px 10px;
      }
   }
}
@media only screen and (min-width: 768px) {
   div.reserves-content  {
       width: 75%;
   }
}
@media only screen and (max-width: 768px) {
   div.reserves-content  {
       width: 95%;
   }
}
</style>

