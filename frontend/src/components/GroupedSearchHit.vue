<template>
   <div class="group-hit" v-bind:data-identifier="hit.identifier">
      <SearchHitHeader :hit="hit" :pool="pool"/>
      <div class="top">
         <div class="basic">
            <div v-if="hit.header.author" class="author">
               <TruncatedText :title="hit.header.author.label" 
                  :text="hit.header.author.value.join('; ')" :limit="80" />
            </div>
            <dl class="fields">
               <template v-for="(field,idx) in hit.basicFields">
                  <template v-if="shouldDisplay(field)">
                     <dt :key="getKey(field,`gk${idx}`)">{{field.label}}:</dt>
                     <dd :key="getKey(field,`gv${idx}`)" v-html="fieldValueString(field)"></dd>
                  </template>
               </template>
               <template v-if="accessURLField">
                  <dt class="label">{{accessURLField.label}}:</dt>
                  <dd class="value">
                     <AccessURLDetails mode="brief" :pool="pool" :urls="accessURLField.value" />
                  </dd>
               </template>
            </dl>
         </div>
         <router-link class="img-link" :to="detailsURL">
            <img class="cover-img" v-if="hit.cover_image" :src="hit.cover_image"/>
         </router-link>
      </div>
      <div class="digital-content" v-if="hasDigitalContent" v-html="digitalContentLinks"></div>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import SearchHitHeader from '@/components/SearchHitHeader'
import AccessURLDetails from '@/components/AccessURLDetails'
import TruncatedText from '@/components/TruncatedText'
export default {
   props: {
      hit: { type: Object, required: true},
      pool: {type: String, required: true},
   },
   components: {
      SearchHitHeader, AccessURLDetails, TruncatedText
   },
   computed: {
      ...mapGetters({
         isKiosk: "system/isKiosk",
      }),
      detailsURL() {
         return `/sources/${this.pool}/items/${this.hit.identifier}`
      },
      accessURLField() {
         return this.hit.basicFields.find(f => f.name=="access_url")
      },
      hasDigitalContent() {
         if (this.isKiosk) return false
         let dc = this.hit.basicFields.find(f => f.name=="pdf_download_url")   
         return dc
      },
      digitalContentLinks() {
         let dc = this.hit.basicFields.find(f => f.name=="pdf_download_url")  
         return `<a href="${dc.value}"><i class="icon far fa-file-pdf"></i><label>Download PDF</label></a>`
      },
   },
   methods: {
      getKey(field,idx) {
         return this.hit.identifier+field.value+idx
      },
      shouldDisplay(field) {
         if (field.display == 'optional' || field.type == "url") return false
         if ( this.isKiosk && field.type == "url") return false
         return true
      },
      fieldValueString( field ) {
         if ( Array.isArray(field.value)) {
            return field.value.join(", ")
         }
         if (field.type == "url") {
            return `<a href="${field.value}" target="_blank"><i style="margin-right:5px;" class="more fas fa-link"></i>External Link</a>`
         }
         return field.value
      },
   }
};
</script>

<style lang="scss" scoped>
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
.digital-content {
   padding: 0 5px;
   ::v-deep a {
      text-align: center !important;
      display: inline-block;
   }
   ::v-deep .icon {
      font-size: 1.75em;
      display: block;
      color: var(--uvalib-text);
   }
   ::v-deep label {
      font-size: 0.8em;
      color: var(--uvalib-text);
      display: block;
      cursor: pointer;
      font-weight: normal;
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
   grid-template-columns: 1fr 2fr; 
   grid-column-gap: 10px; 
}
dt {
   font-weight: bold;
   text-align: right;
}
dd {
   margin: 0 0 10px 0;
}
</style>
