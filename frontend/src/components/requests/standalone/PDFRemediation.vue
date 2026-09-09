<template>
   <div class="request-panel">
      <h3>PDF Remediation Request</h3>
      <div class="limit-reached" v-if="requestStore.isRemediateDisabled">
         <div class="message">
            You've reached the active request limit of {{ requestStore.requestStats.remediationLimit }} PDF remediation requests at a time.
         </div>
         <VirgoButton severity="secondary" @click="emit('canceled')" label="Cancel"/>
      </div>
      <FormKit v-else type="form" ref="pdfform" id="pdf-remediation" :actions="false" @submit="doSubmit">
         <FormKit label="Course Information" type="textarea" :rows="2" v-model="request.course" id="course"
            validation="required" help="Please supply the Course Instructor, Course Name, Number, Section and Semester"
         />
         <FormKit label="Title of Work" type="text" v-model="request.work" validation="required"
            help="Please only upload previous scans that need remediation owned by UVA Libraries"
         />
         <FormKit label="Article or Chapter Title" type="text" v-model="request.title" validation="required"/>
         <label>
            <FileUpload name="file" chooseLabel="Select a PDF to upload for remeditaion"
               :customUpload="true" mode="basic"
               @uploader="startUpload($event)" @select="pdfSelected($event)"
               :withCredentials="true" ref="fileuploader"
               :showUploadButton="false" :showCancelButton="false"
               accept="application/pdf"
            />
         </label>
         <p class="error" v-if="pdfMissing"><i class="fas fa-exclamation-triangle"></i>A PDF file is required</p>
         <FormKit label="Notes or Special Instructions" type="textarea" v-model="request.notes" :rows="2"
            help="(ex: missing from shelf, specific edition needed)"
         />
         <div class="form-controls">
            <VirgoButton severity="secondary" label="Cancel" @click="emit('canceled')" />
            <VirgoButton label="Submit" @click="submitClicked()" :disabled="requestStore.working" :loading="requestStore.working" />
         </div>
      </FormKit>
   </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRequestStore } from "@/stores/request"
import analytics from '@/analytics'
import FileUpload from 'primevue/fileupload'
import { setFocusID } from '@/utils'

const emit = defineEmits( ['submitted', 'canceled'] )

const request = ref({
   course: "",
   work: "",
   title: "",
   notes: ""
})
const selectedPDF = ref("")
const pdfMissing = ref(false)

const fileuploader = ref()
const pdfform = ref()

const requestStore = useRequestStore()

const startUpload = ( async (event) => {
   const file = event.files[0]
   await requestStore.submitPDFRemediationRequest(request.value, file)
   emit('submitted')
})

const pdfSelected = ( (event) => {
   selectedPDF.value = event.files[0].name
   pdfMissing.value = false
})

const submitClicked = (async () => {
   // the fileuploader is not part of formkit so validate it first and abort 
   // if a pdf has not been selected
   pdfMissing.value = (selectedPDF.value == "" )
   if (pdfMissing.value)  return

   // next kick pf formkit validate and submit process.
   // if there are any errors, doSubmit below will not be called
   pdfform.value.node.submit()
})

const doSubmit = (() => {
   fileuploader.value.upload()
})

onMounted(()=>{
   analytics.trigger('Requests', 'REQUEST_STARTED', "pdfRemediation")
   setFocusID("course")
})
</script>

<style lang="scss" scoped>
.limit-reached {
   text-align: right;
   .message {
      font-size: 1em;
      font-weight: bold;
      text-align: center;
      padding: 10px;
      border-radius: 0.3rem;
      color: $uva-text-color-dark;
      background-color: $uva-red-100;
      margin: 0 0 10px 0;
   }
}
.error {
   margin: 0;
   color: $uva-red-A;
   i {
      display: inline-block;
      margin-right: 5px;
   }
}
</style>
