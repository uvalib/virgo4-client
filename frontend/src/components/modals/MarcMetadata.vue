<template>
   <VirgoButton @click="showDialog=true" ref="trigger" severity="secondary" label="View" icon="pi pi-code" size="small" />
   <Dialog v-model:visible="showDialog" :modal="true" position="top" header="MARC XML" style="width:75%" :maximizable="true">
      <pre class="xml">{{ beautifiedXML }}</pre>
   </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import beautify from 'xml-beautifier'
import Dialog from 'primevue/dialog'

const showDialog = ref(false)

const props = defineProps({
   xml: {
      type: String,
      required: true
   },
})

const beautifiedXML = computed(() => {
   let out = beautify(props.xml).trim()
   console.log(out)
   return out
})

</script>

<style lang="scss" scoped>
.xml {
   font-weight: normal;
   border: 1px solid $uva-grey-100;
   padding: 10px;
   margin: 0;
   white-space: pre-wrap;       /* Since CSS 2.1 */
   white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
   white-space: -pre-wrap;      /* Opera 4-6 */
   white-space: -o-pre-wrap;    /* Opera 7 */
   word-wrap: break-word;       /* Internet Explorer 5.5+ */
}
</style>