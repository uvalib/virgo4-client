<template>
   <div v-if="metadata" class="ai-debug-info">
      <div class="debug-details">
         <span class="label">AI Debug:</span>
         <span class="metric">Model: {{metadata.model}}</span>
         <span class="sep">|</span>
         <span class="metric">Total: {{metadata.total_time_ms}}ms</span>
         <span class="sep">|</span>
         <span class="metric">Cycles: {{metadata.cycle1_time_ms}} / {{metadata.cycle2_time_ms}} / {{metadata.cycle3_time_ms}} ms</span>
         <span class="sep">|</span>
         <span class="metric">Tokens: {{metadata.input_tokens}} in / {{metadata.output_tokens}} out</span>
         <template v-if="metadata.cost_per_1k">
            <span class="sep">|</span>
            <span class="metric">Cost/1k requests: ${{metadata.cost_per_1k.toFixed(4)}}</span>
         </template>
      </div>
      <div class="debug-toggles">
         <button v-if="metadata.input_prompt" class="toggle-link" @click="showPrompt = !showPrompt">
            {{ showPrompt ? 'Hide' : 'View' }} Prompt
         </button>
         <button v-if="metadata.raw_output" class="toggle-link" @click="showRaw = !showRaw">
            {{ showRaw ? 'Hide' : 'View' }} Raw LLM
         </button>
         <button v-if="metadata.reasoning" class="toggle-link" @click="showReasoning = !showReasoning">
            {{ showReasoning ? 'Hide' : 'View' }} Reasoning
         </button>
      </div>
      <div v-if="showPrompt" class="debug-pane">
         <h5>Input Prompt</h5>
         <pre>{{metadata.input_prompt}}</pre>
      </div>
      <div v-if="showRaw" class="debug-pane">
         <h5>Raw LLM Output</h5>
         <pre>{{metadata.raw_output}}</pre>
      </div>
      <div v-if="showReasoning" class="debug-pane">
         <h5>Model Reasoning</h5>
         <pre>{{metadata.reasoning}}</pre>
      </div>
   </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
   metadata: {
      type: Object,
      required: false,
      default: null
   }
})

const showPrompt = ref(false)
const showRaw = ref(false)
const showReasoning = ref(false)
</script>

<style lang="scss" scoped>
.ai-debug-info {
   font-family: monospace;
   font-size: 0.8em;
   color: #666;
   margin-top: 10px;
   padding-top: 10px;
   border-top: 1px dashed #e9ecef;
   .debug-details {
      display: flex;
      flex-flow: row wrap;
      gap: 10px;
      align-items: center;
      .label {
         font-weight: bold;
         color: $uva-text-color-dark;
      }
      .metric {
         background-color: #f8f9fa;
         padding: 2px 4px;
         border-radius: 3px;
         border: 1px solid #e9ecef;
      }
   }
   .debug-toggles {
      margin-top: 10px;
      display: flex;
      gap: 15px;
      .toggle-link {
         background: none;
         border: none;
         color: #007bff;
         cursor: pointer;
         padding: 0;
         font-size: 0.9em;
         text-decoration: underline;
         &:hover {
            color: #0056b3;
         }
      }
   }
   .debug-pane {
      margin-top: 10px;
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      padding: 10px;
      h5 {
         margin: 0 0 5px 0;
         font-size: 0.9em;
         color: #333;
         text-transform: uppercase;
      }
      pre {
         margin: 0;
         white-space: pre-wrap;
         word-wrap: break-word;
         max-height: 300px;
         overflow-y: auto;
         font-size: 0.9em;
         background: none;
         border: none;
         padding: 0;
      }
   }
}
</style>
