<template>
   <div class="prompt-admin">
      <div class="content form">
         <div class="help">
            Use this custom prompt to drive the AI agent used by the suggestor. It uses two variables:
            <ul>
               <li><pre>$QUERY</pre>: this will be replaced by the search query.</li>
               <li><pre>$SUGGESTIONS</pre>: these are the default suggestions that will be augmented by AI.</li>
            </ul>
            If either is omitted, that data will not be present in the prompt
         </div>
         <textarea
            aria-label="modify you custom ai search prompt"
            v-model="preferences.aiPrompt"
            rows="20"
            cols="40"
            placeholder="Enter your AI prompt here"
         ></textarea>
         <div class="ai-model">
            <h3>AI Model Selection</h3>
            <p class="model-note">The system uses <b>Google Gemma 3 4B</b> by default.</p>
            <Dropdown
               id="ai-model"
               v-model="preferences.aiModel"
               :options="modelOptions"
               optionLabel="label"
               optionValue="value"
               placeholder="Select AI Model"
            />
         </div>
         <div class="ai-debug">
            <Checkbox v-model="preferences.aiDebug" :binary="true" inputId="ai-debug" />
            <label for="ai-debug" class="ml-10">Enable AI Debug Mode (Admin Only)</label>
         </div>
         <div class="ai-debug">
            <Checkbox v-model="preferences.aiKBOnly" :binary="true" inputId="ai-kbonly" />
            <label for="ai-kbonly" class="ml-10">KB Only Mode (Disable LLM synthesis for Authors)</label>
         </div>
         <div class="features">
            <h3>Features</h3>
            <div class="feature">
               <Checkbox v-model="preferences.aiFeatures" value="didyoumean" inputId="didyoumean" />
               <label for="didyoumean" class="ml-10">Enable "Did You Mean" query refinements</label>
            </div>
            <div class="feature">
               <Checkbox v-model="preferences.aiFeatures" value="images" inputId="images" />
               <label for="images" class="ml-10">Enable Image suggestions (Knowledge Base)</label>
            </div>
         </div>

         <div class="kb-thresholds">
            <h3>Knowledge Base Thresholds</h3>
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
         </div>

         <VirgoButton @click="save">Save Settings</VirgoButton>
      </div>
   </div>
</template>

<script setup>
import { usePreferencesStore } from "@/stores/preferences"
import { useSystemStore } from "@/stores/system"
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import Slider from 'primevue/slider'

const preferences = usePreferencesStore()
const system = useSystemStore()

const modelOptions = [
   { label: "System Default", value: "default" },
   { label: "Google Gemma 3 12B (it)", value: "google.gemma-3-12b-it" },
   { label: "Google Gemma 3 27B (it)", value: "google.gemma-3-27b-it" },
   { label: "Moonshot Kimi k2.5", value: "moonshotai.kimi-k2.5" },
   { label: "NVIDIA Nemotron Nano 9B v2", value: "nvidia.nemotron-nano-9b-v2" },
   { label: "Anthropic Claude 4.5 Haiku", value: "anthropic.claude-haiku-4-5-20251001-v1:0" }
]

const save = ( async () => {
   await preferences.saveAIPrompt()
   system.setToast("Success", "Your custom prompt has been saved")
})
</script>

<style lang="scss" scoped>
.prompt-admin {
   border: 1px solid $uva-grey-100;
   border-top: 0;
   border-radius: 0 0 0.3rem 0.3rem;
   .content.form {
      padding: 20px;
      display: flex;
      flex-flow: column;
      justify-content: flex-start;
      gap: 14px;
      div.help {
         text-align: left;
         border-radius: 0.3rem;
         color: $uva-text-color-dark;
         background-color: $uva-blue-alt-400;
         padding: 10px 15px;
         border: 1px solid  $uva-blue-alt;
         pre {
            display: inline-block;
            margin:4px 0;
            font-weight: bold;
         }
      }

      textarea {
         border: 1px solid $uva-grey-100;
         padding: 20px;
         border-radius: 0.3rem;
      }
      .ai-debug {
         display: flex;
         flex-flow: row nowrap;
         align-items: center;
         justify-content: flex-start;
         gap: 10px;
         font-size: 0.9em;
         font-weight: bold;
         color: $uva-text-color-dark;
         label {
            cursor: pointer;
         }
      }
      .features {
         text-align: left;
         h3 {
             margin: 0 0 10px 0;
             font-size: 1.1em;
         }
         .feature {
             display: flex;
             align-items: center;
             gap: 10px;
             font-size: 0.9em;
             font-weight: bold;
             color: $uva-text-color-dark;
             label {
                 cursor: pointer;
             }
         }
      }
      .ai-model {
         text-align: left;
         h3 {
             margin: 0 0 5px 0;
             font-size: 1.1em;
         }
         .model-note {
             margin: 0 0 10px 0;
             font-size: 0.9em;
             color: $uva-text-color-dark;
             opacity: 0.8;
         }
         :deep(.p-dropdown) {
            width: 100%;
            max-width: 400px;
            text-align: left;
            .p-dropdown-label {
               padding: 8px 12px;
            }
         }
      }
      .kb-thresholds {
         text-align: left;
         border-top: 1px solid $uva-grey-100;
         padding-top: 20px;
         h3 {
             margin: 0 0 15px 0;
             font-size: 1.1em;
         }
         .threshold {
            margin-bottom: 20px;
            label {
               display: block;
               font-size: 0.9em;
               font-weight: bold;
               margin-bottom: 10px;
               color: $uva-text-color-dark;
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
}
</style>