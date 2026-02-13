<template>
   <div class="prompt-admin">
      <div class="content form">
         <p>
            Use this custom prompt to drive the AI agent used by the suggestor. It uses two variables:
            <ul>
               <li><pre>$SEARCH</pre>: this will be replaced by the search query.</li>
               <li><pre>$RESULTS</pre>: this will be replaced by the initial suggestor result.</li>
            </ul>
            If either is omitted, that data will not be present in the prompt
         </p>
         <textarea
            aria-label="modify you custom ai search prompt"
            v-model="preferences.aiPrompt"
            rows="20"
            cols="40"
            placeholder="Enter your AI prompt here"
         ></textarea>
         <VirgoButton @click="save">Save Prompt</VirgoButton>
      </div>
   </div>
</template>

<script setup>
import { usePreferencesStore } from "@/stores/preferences"

const preferences = usePreferencesStore()

function save() {
   preferences.saveAIPrompt()
}
</script>

<style lang="scss" scoped>
.prompt-admin {
   border: 1px solid $uva-grey-100;
   border-top: 0;
   border-radius: 0 0 0.3rem 0.3rem;
   .content.form {
      padding: 5px 20px 20px 20px;
      display: flex;
      flex-flow: column;
      justify-content: flex-start;
       p {
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
         margin-bottom: 15px;
      }
   }
}
</style>