<template>
   <div class="image-viewer">
      <template v-if="isGrouped && mode != 'single'">
         <viewer :images="details.related" class="img-view" ref="viewer" :options="viewerOpts">
            <template slot-scope="scope">
               <template  v-for="(r,idx) in scope.images">
                  <div class="thumb-wrap" :key="`w${idx}`">
                     <img :src="relatedImageURL(r,'thumb')" :data-src="relatedImageURL(r,'full')"
                        class="thumb small" >
                     <div class="thumb-toolbar">
                        <router-link class="img-link" :to="detailsURL(r)">
                           Details
                        </router-link>
                        <span v-if="manifestURL" class="iiif-small">
                           <a :href="manifestURL" target="_blank">
                              <span class="iiif-icon"></span>
                           </a>
                        </span>
                     </div>
                  </div>
               </template>
            </template>
         </viewer>
         <div  v-if="manifestURL" class="iiif-help">
            <span>What is <img src="../assets/iiif_icon.png"/></span>
            <IIIFInfo style="display:inline-block;margin-left: 5px;"/>
         </div>
      </template>

      <template v-else>
         <viewer class="img-view large" ref="viewer" :options="viewerOpts">
            <img :src="imageURL('med')" :data-src="imageURL('full')" class="pure-img thumb large">
         </viewer>

         <div class="img-toolbar">
            <span class="hint">Click image to zoom</span>
            <span  v-if="manifestURL" class="iiif">
               <a :href="manifestURL" target="_blank">
                  <img src="../assets/iiif_icon.png"/>
               </a>
               <IIIFInfo style="display:inline-block;margin-left: 5px;"/>
            </span>
         </div>
      </template>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import IIIFInfo from "@/components/popovers/IIIFInfo"

export default {
   data: function() {
      return {
         viewerOpts: {
            title: false, url: 'data-src', inline: false,
            backdrop:true, navbar:false, button:true,
            toolbar:false, loop: false, fullScreen: true,
            zIndex: 9999
         },
      };
   },
   props: {
      mode: {
         type: String,
         default: "grouped"
      },
   },
   components: {
      IIIFInfo
   },
   computed: {
      ...mapState({
         details : state => state.item.details,
      }),
      ...mapGetters({
         isKiosk: 'system/isKiosk',
         isUVA: 'pools/isUVA',
      }),
      allFields() {
         return [...this.details.basicFields.concat(this.details.detailFields)]
      },
      manifestURL() {
         if (this.isKiosk) return ""
         let iiifField = this.allFields.find( f => f.type=="iiif-manifest-url")
         return iiifField.value
      },
      isGrouped() {
         return this.details.related && this.details.related.length > 1
      },
   },
   methods: {
      imageURL(size) {
         let iiifField = this.allFields.find( f => f.type=="iiif-base-url")
         if ( size == 'full') {
            return [`${iiifField.value}/full/2000,/0/default.jpg`]
         }
         if ( size == 'med') {
            return [`${iiifField.value}/full/750,/0/default.jpg`]
         }
         return [`${iiifField.value}/square/200,200/0/default.jpg`]
      },
      detailsURL( rel ) {
         return `/sources/${this.details.source}/items/${rel.id}?mode=single`
      },
      relatedImageURL( rel, size ) {
         let baseURL = rel['iiif_base_url']
         if (size == 'full') {
            return [`${baseURL}/full/1200,/0/default.jpg`]
         }
         return [`${baseURL}/square/250,250/0/default.jpg`]
      },
   },

}
</script>
<style scoped>
.iiif {
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
}
div.img-view {
   display: grid;
   grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
   grid-gap: 1.5rem;
   margin: 0 5px 20px 5px;
   padding: 0;
   height: 100%;
   text-align: left;
}
div.img-toolbar {
   display: flex;
   flex-flow: row nowrap;
   justify-content: space-between;
   padding: 5px 0;
   box-sizing: border-box;
}
.thumb-wrap {
   display: inline-block;
   max-width: 250px;
}
.thumb-wrap  img {
  max-width: 100%;
  height: auto;
  align-self: center;
  display: block;
  min-width: 175px;
  min-height: 175px;
  background-color: white;
  background-image: url('~@/assets/dots-white-bg.gif');
  background-repeat:no-repeat;
  background-position: center center;
}
span.hint {
   font-size: 0.9em;
   padding: 5px;
   box-sizing: border-box;
}
img.thumb {
   box-sizing: border-box;
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
}
img.thumb.small {
   background-image: url('~@/assets/dots.gif');
   background-repeat:no-repeat;
   background-position: center center;
   min-width: 175px;
   min-height: 175px;
   background-color: white;
}
img.thumb:hover {
   cursor:pointer;
}
.iiif-help {
  border-top: 1px solid var(--uvalib-grey-light);
  padding-top: 1rem;
}
.thumb-toolbar {
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-start;
   justify-content: space-between;
   margin-top: .5em;
}
.iiif-icon {
   background-image: url('~@/assets/iiif_icon.png');
   background-size: contain;
   display: inline-block;
   width: 35px;
   height: 30px;
}
.img-link {
   padding-bottom:5px;
}
@media only screen and (min-width: 768px) {
   div.img-toolbar, .img-view.large {
      max-width: 70%;
   }
}
</style>
