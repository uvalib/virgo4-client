<template>
   <div class="prompt-admin">
      <div class="content form">

         <div class="section">
            <h3>AI Model Selection</h3>
            <div class="section-content">
               <p class="model-note">The system uses <b>Google Gemma 3 4B</b> by default.</p>
               <Select style="max-width: 400px"
                  id="ai-model"
                  v-model="preferences.aiModel"
                  :options="modelOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select AI Model"
               />
            </div>
         </div>

         <div class="section">
            <div class="section-content">
               <div class="config-opt">
                  <Checkbox v-model="preferences.aiDebug" :binary="true" inputId="ai-debug" />
                  <label for="ai-debug">Enable AI Debug Mode (Admin Only)</label>
               </div>
               <div class="config-opt">
                  <Checkbox v-model="preferences.aiKBOnly" :binary="true" inputId="ai-kbonly" />
                  <label for="ai-kbonly">KB Only Mode (Disable LLM synthesis for Authors)</label>
               </div>
               <div class="config-opt">
                  <Checkbox v-model="preferences.aiCacheDisabled" :binary="true" inputId="ai-nocache" />
                  <label for="ai-nocache">Disable recent suggestions cache</label>
               </div>
            </div>
         </div>

         <div class="section">
            <h3>Features</h3>
            <div class="section-content">
               <div class="config-opt">
                  <Checkbox v-model="preferences.aiFeatures" value="didyoumean" inputId="didyoumean" />
                  <label for="didyoumean">Enable "Did You Mean" query refinements</label>
               </div>
               <div class="config-opt">
                  <Checkbox v-model="preferences.aiFeatures" value="images" inputId="images" />
                  <label for="images">Enable Image suggestions (Knowledge Base)</label>
               </div>
               <div class="config-opt">
                  <Checkbox v-model="preferences.aiFeatures" value="book" inputId="book" />
                  <label for="book">Enable Book suggestions (Knowledge Base + LLM)</label>
               </div>
            </div>
         </div>

         <div class="section">
            <h3>Knowledge Base Thresholds</h3>
            <div class="section-content spaced">
               <div class="threshold">
                  <label for="author-threshold">Author Confidence Threshold: {{ preferences.aiAuthorThreshold.toFixed(2) }}</label>
                  <Slider v-model="preferences.aiAuthorThreshold" :min="0" :max="1" :step="0.01" id="author-threshold" class="mt-10" />
                  <p class="note">Lower values include more authors but may be less relevant (0.3 recommended).</p>
               </div>
               <div class="threshold">
                  <label for="image-threshold">Image Confidence Threshold: {{ preferences.aiImageThreshold.toFixed(2) }}</label>
                  <Slider v-model="preferences.aiImageThreshold" :min="0" :max="1" :step="0.01" id="image-threshold" class="mt-10" />
                  <p class="note">Lower values include more images (0.1 recommended).</p>
               </div>
               <div class="threshold">
                  <label for="book-threshold">Book Confidence Threshold: {{ preferences.aiBookThreshold.toFixed(2) }}</label>
                  <Slider v-model="preferences.aiBookThreshold" :min="0" :max="1" :step="0.01" id="book-threshold" class="mt-10" />
                  <p class="note">Lower values include more books (0.1 recommended).</p>
               </div>
            </div>
         </div>

         <VirgoButton @click="save">Save Settings</VirgoButton>
      </div>
   </div>
</template>

<script setup>
import { usePreferencesStore } from "@/stores/preferences"
import { useSystemStore } from "@/stores/system"
import { useSuggestorStore } from "@/stores/suggestor"
import Checkbox from 'primevue/checkbox'
import Select from 'primevue/select'
import Slider from 'primevue/slider'

const preferences = usePreferencesStore()
const system = useSystemStore()
const suggestor = useSuggestorStore()

const modelOptions = [
   { label: "System Default", value: "default" },
   { label: "Google Gemma 3 12B (it)", value: "google.gemma-3-12b-it" },
   { label: "Google Gemma 3 27B (it)", value: "google.gemma-3-27b-it" },
   { label: "Moonshot Kimi k2.5", value: "moonshotai.kimi-k2.5" },
   { label: "NVIDIA Nemotron Nano 9B v2", value: "nvidia.nemotron-nano-9b-v2" },
   { label: "Anthropic Claude 4.5 Haiku", value: "anthropic.claude-haiku-4-5-20251001-v1:0" }
]

const save = ( async () => {
   await preferences.save()
   system.setToast("Success", "Your suggestor configuration has been saved.")
   
   // since settings have changed, purge the suggestor cache
   suggestor.clearCache()

})
</script>

<style lang="scss" scoped>
.prompt-admin {
   border: 1px solid $uva-grey-100;
   border-top: 0;
   border-radius: 0 0 0.3rem 0.3rem;
   text-align: left;

   .section {
      display: flex;
      flex-direction: column;
      gap: 10px;
      h3 {
         margin: 0;
         font-size: 1.15em;
      }
      .section-content {
         display: flex;
         flex-direction: column;
         gap: 10px;
         p {
            margin:0;
            padding:0;
         }
      }
      .section-content.spaced {
         gap: 20px;
      }
   }

   .content.form {
      padding: 20px;
      display: flex;
      flex-flow: column;
      justify-content: flex-start;
      gap: 30px;

      .config-opt {
         display: flex;
         flex-flow: row nowrap;
         align-items: center;
         justify-content: flex-start;
         gap: 10px;
         color: $uva-text-color-dark;
         label {
            cursor: pointer;
         }
      }
      
      .threshold {
         display: flex;
         flex-direction: column;
         gap: 5px;

         label {
            margin: 5px 0 10px 0;
         }
         .note {
            margin: 10px 0 0 0;
            font-size: 0.85em;
            color: $uva-text-color-dark;
            opacity: 0.7;
         }
         :deep(.p-slider) {
            max-width: 400px;
         }
      }
   }
}
</style>