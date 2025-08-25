<template>
   <div class="request-panel">
      <h3>PDF Remediation Request</h3>
       <FormKit type="form" id="pdf-remediation" :actions="false" @submit="submitClicked" incompleteMessage="Sorry, not all fields are filled out correctly.">
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
               @uploader="startUpload($event)"
               :withCredentials="true" ref="fileuploader"
               :showUploadButton="false" :showCancelButton="false"
               accept="application/pdf"
            />
         </label>
         <V4FormActions :hasCancel="true" submitLabel="Submit" submitID="submit-pdf-remediation"
            :disabled="requestStore.buttonDisabled" @canceled="emit('canceled')"/>
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
})

const fileuploader = ref()

const requestStore = useRequestStore()

const startUpload = ( async (event) => {
   const file = event.files[0]
   await requestStore.submitPDFRemediationRequest(request.value, file)
   emit('submitted')
})

const submitClicked = (async () => {
   fileuploader.value.upload()
})

onMounted(()=>{
   analytics.trigger('Requests', 'REQUEST_STARTED', "pdfRemediation")
   setFocusID("course")
})
</script>

<style lang="scss" scoped>
</style>
