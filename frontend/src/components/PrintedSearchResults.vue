<template>
   <div id="print-results">
      <div class="list">
         <div v-for="hit in selectedResults.hits" class="hit-wrapper" :key="`hit-${hit.number}-${hit.identifier}`">
            <div class="title">
               <div class="hit-title">
                  <span class="number">{{hit.number}}.</span>
                  <span v-html="hit.header.title"></span>
               </div>
               <div v-if="hit.header.subtitle" class="hit-subtitle" v-html="hit.header.subtitle"></div>
            </div>
            <div class="author" v-if="hit.header.author_display">{{hit.header.author_display}}</div>
            <table class="fields">
               <template v-for="(field,idx) in hit.basicFields">
                  <tr :key="`pf${idx}`" class="field" v-if="shouldDisplay(field)">
                     <td class="label">{{field.label}}:</td>
                     <td>{{$utils.fieldValueString(field)}}</td>
                  </tr>
               </template>
            </table>
            <template  v-if="hit.grouped">
               <div class="hit-wrapper group" v-for="(groupHit,idx) in hit.group" :key="`pg${idx}`">
                  <div class="title">
                     <div class="hit-title">
                        <span class="number">{{groupHit.number}}.</span>
                        <span v-html="groupHit.header.title"></span>
                     </div>
                     <div v-if="groupHit.header.subtitle" class="hit-subtitle" v-html="groupHit.header.subtitle"></div>
                  </div>
                  <div class="author" v-if="groupHit.header.author_display">{{groupHit.header.author_display}}</div>
                  <table class="fields">
                     <template v-for="(field,idx) in groupHit.basicFields">
                        <tr :key="`pf${idx}`" class="field" v-if="shouldDisplay(field)">
                           <td class="label">{{field.label}}:</td>
                           <td>{{$utils.fieldValueString(field)}}</td>
                        </tr>
                     </template>
                  </table>
               </div>
            </template>
         </div>
      </div>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
export default {
   computed: {
      ...mapGetters({
         selectedResults: 'selectedResults',
      })
   },
   methods: {
      shouldDisplay(field) {
         if (field.display == 'optional' || field.type == "url" || field.type == "availability" ||
            field.name == "location" || field.name== 'abstract' ||
            field.type == "access-url" || field.name.includes("_download_url") ) return false
         return true
      },
   }
}
</script>

<style lang="scss" scoped>
#print-results {
   background: white;
   text-align: left;
   margin-left: 10px;
   position: absolute;
   right: 50000px;
   .hit-wrapper.group {
      border-bottom: 0;
      margin: 15px 0 0 0;
      padding: 15px 0 0 0;
      border-top: 1px solid black;
   }
   .hit-wrapper {
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid black;
      .hit-title {
         font-weight: bold;
         .number {
            margin-right: 5px;
            font-weight: normal;
         }
      }
      .author {
         margin-left: 10px;
      }
      .fields {
         font-size: 0.85em;
         margin: 10px 0 0 10px;
         .label {
            font-weight: bold;
            margin-right: 5px;
            text-align: right;
            padding-right: 5px;
         }
      }
   }
}
</style>