<template>
   <div class="request-panel">
      <h2>Instructional Scanning Request</h2>
       <FormKit type="form" id="instructional-scan" :actions="false" @submit="submitClicked" incompleteMessage="Sorry, not all fields are filled out correctly.">
         <FormKit label="Course Information" type="textarea" :rows="2" v-model="request.course" id="course"
            validation="required" help="Please supply the Course Instructor, Course Name, Number, Section and Semester"
         />
         <FormKit label="Will you be providing a copy of this material for the Library to scan?" type="radio"
            v-model="request.personalCopy" :options="{true: 'Yes', false: 'No'}"
         />
         <div class="instruct" v-if="request.personalCopy=='true'">
            <p>Personal copies can be dropped off at a Library Circulation Desk, deposited in a Book Drop, or sent via campus mail to:</p>
            <p class="addy">
               Instructional Scanning Services<br/>
               PO BOX 400109
            </p>
            <p>
               <b>** Please include a note with instructor name and course information in the item when dropping off a personal copy.</b>
            </p>
         </div>
         <FormKit label="Article or Chapter Title" type="text" v-model="request.title" validation="required"
            help="One article or chapter per request, please"
         />
         <FormKit label="Article or Chapter Author" type="text" v-model="request.author" validation="required"/>
         <FormKit label="Title of Work" type="text" v-model="request.work" validation="required"
            help="Journal, Book, Conference Proceedings or Newspaper"
         />
         <FormKit label="Volume" type="text" v-model="request.volume"/>
         <FormKit label="Issue" type="text" v-model="request.issue"/>
         <FormKit label="Month" type="text" v-model="request.month"/>
         <FormKit label="Year" type="text" v-model="request.year" placeholder="yyyy" validation="required|date_format:YYYY"/>
         <FormKit label="Pages" type="text" v-model="request.pages" validation="required|length:1,25" help="(ex: 1-15)"/>
         <FormKit label="ISBN/ISSN" type="text" v-model="request.issn"/>
         <FormKit label="OCLC Number" type="text" v-model="request.oclc"/>
         <FormKit label="Will you accept the item in a language other than English?" type="radio"
            v-model="request.anyLanguage" :options="{'true': 'Yes', 'false': 'No'}"
         />

         <ILLCopyrightNotice type="instruction" />
         <V4FormActions :hasCancel="true" submitLabel="Submit" submitID="submit-borrow-av"
            :disabled="requestStore.buttonDisabled" @canceled="emit('canceled')"/>
      </FormKit>
   </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import ILLCopyrightNotice from '../ILLCopyrightNotice.vue'
import { useRequestStore } from "@/stores/request"
import analytics from '@/analytics'

const emit = defineEmits( ['submitted', 'canceled'] )

const request = ref({
   scanType: "INSTRUCTIONAL",
   course: "",
   personalCopy: "false",
   title: "",
   author: "",
   work: "",
   volume: "",
   issue: "",
   month: "",
   year: "",
   pages: "",
   issn: "",
   oclc: "",
   anyLanguage: "true"
})

const requestStore = useRequestStore()

async function submitClicked() {
   await requestStore.submitILLiadScanRequest(request.value)
   emit('submitted')
}

onMounted(()=>{
   analytics.trigger('Requests', 'REQUEST_STARTED', "illiadScan")
   let ele = document.getElementById("course")
   ele.focus()
})
</script>

<style lang="scss" scoped>
.request-panel {
   padding: 15px;
   margin-bottom: 25px;
   border-bottom: 1px solid var(--uvalib-grey-light);
   h2 {
      color: var(--uvalib-text-dark);
      font-weight: 500;
      padding: 0;
      margin: 0 0 15px 0px;
      font-size: 1.2em;
   }
   .instruct {
      margin: 10px 0;
      background: var(--uvalib-grey-lightest);
      padding: 5px 15px;
      border-radius: 5px;
      border: 1px solid var(--uvalib-grey-light);
      .addy {
         margin-left: 20px;
      }
   }
   .notice {
      margin-top: 25px;
   }
}
</style>
