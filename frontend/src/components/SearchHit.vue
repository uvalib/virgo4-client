<template>
   <div class="hit">
      <SearchHitHeader :maxLen="60" :count="count" :hit="hit" :pool="pool"/>
      <div class="top">
         <div class="basic">
            <div v-if="hit.header.author" class="author">
               <TruncatedText title="Author" :text="hit.header.author.join('; ')" :limit="60" />
            </div>
            <dl class="fields">
               <template v-for="(field) in hit.basicFields">
                  <template v-if="shouldDisplay(field)">
                     <dt :key="getKey(field,'k')">{{field.label}}:</dt>
                     <dd :key="getKey(field,'v')" >
                        <div v-if="field.type == 'url'" v-html="fieldValueString(field)"></div>
                        <TruncatedText v-else :title="field.label" :text="fieldValueString(field)" :limit="60" />
                     </dd>
                  </template>
               </template>
            </dl>
         </div>
         <router-link class="img-link" :to="detailsURL">
            <img class="cover-img" v-if="hit.cover_image" :src="hit.cover_image"/>
         </router-link>
      </div>
      <AccordionContent v-if="hit.grouped" :title="groupTitle"
         class="group" :autoCollapseOn="searching">
         <div class="group-item-wrapper" v-for="(groupHit,idx) in hit.group" :key="idx">
            <GroupedSearchHit :pool="pool" :hit="groupHit" :key="idx"/>
         </div>
      </AccordionContent>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import SearchHitHeader from '@/components/SearchHitHeader'
import AccordionContent from '@/components/AccordionContent'
import GroupedSearchHit from '@/components/GroupedSearchHit'
import TruncatedText from '@/components/TruncatedText'
export default {
   props: {
      hit: { type: Object, required: true},
      pool: {type: String, required: true},
      count: {type: Number, required: true}
   },
   components: {
      SearchHitHeader, AccordionContent, GroupedSearchHit, TruncatedText
   },
   computed: {
      detailsURL() {
         return `/sources/${this.pool}/items/${this.hit.identifier}`
      },
      groupTitle() {
         return `Show other versions (${this.hit.group.length})`
      },
      ...mapState({
         searching: state => state.searching,
      }),
       ...mapGetters({
         isKiosk: "system/isKiosk",
      }),
   },
   methods: {
      getKey(field,idx) {
         return this.hit.identifier+field.value+idx
      },
      shouldDisplay(field) {
         if (field.display == 'optional') return false
         if ( this.isKiosk && field.type == "url") return false
         return true
      },
      fieldValueString( field ) {
         if ( Array.isArray(field.value)) {
            if (field.type == "url") {
               let out = []
               field.value.forEach( (v,idx) => {
                  let url = `<a href="${v}" target="_blank">`
                  if ( idx === 0) {
                     url += `<i style="margin-right: 5px;" class="more fas fa-link"></i>`
                  }
                  url += `External Link #${idx+1}</a>`
                  out.push( url )
               })
               return out.join(",&nbsp;&nbsp;")
            }
            return field.value.join(",&nbsp;")
         }
         if (field.type == "url") {
            return `<a href="${field.value}" target="_blank"><i style="margin-right:5px;" class="more fas fa-link"></i>External Link</a>`
         }
         return field.value
      },
   }
};
</script>

<style scoped>
div.details {
   padding: 10px;
}
.top {
   display:flex;
   flex-flow: row wrap;
   align-items: flex-start;
}
@media only screen and (min-width: 600px) {
   a.img-link {
      margin-left: auto;
   }
}
@media only screen and (max-width: 600px) {
   .top {
      justify-content: center
   }
   a.img-link {
      margin-left: initial;
   }
}
.author {
   margin-bottom: 10px;
}
a.img-link {
   display: inline-block;
}
.cover-img {
   border-radius: 3px;
   margin: 5px;
   max-height: 140px;
   max-width: 140px;
   display: inline-block;
}
div.basic {
   padding: 5px 10px 10px 10px;
}
.hit {
   width: 100%;
   padding: 10px;
   box-sizing: border-box;
   text-align: left;
   background-color: white;
}
.cover-img.small {
   max-height: 124px;
   max-width: 100px;
}
dl {
   margin-top: 0;
   margin-left: 15px;
   display: inline-grid;
   grid-template-columns: max-content 2fr;
   grid-column-gap: 15px;
}
dt {
   font-weight: bold;
   text-align: right;
}
dd {
   margin: 0 0 10px 0;
}
.group-item-wrapper {
   padding: 15px;
   border: 1px solid #ccc;
   border-radius: 5px;
   margin: 10px;
}
</style>
<style>
#app .accordion.group .title {
   padding: 5px 10px;
   font-weight: bold;
   border-radius: 5px;
}
</style>
