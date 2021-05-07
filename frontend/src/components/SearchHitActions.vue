<template>
   <div class="icon-wrap">
      <template v-if="showCitations">
         <div class="citation-control">
            <Citations title="Citations" :id="`citation-${hit.identifier}`" style="margin-right: 10px"
               :itemURL="hit.itemURL" format="all" buttonLabel="Cite" :from="from" :iconInline="true"
               :ariaLabel="`citations for ${hit.identifier}`" >
            </Citations>
         </div>
      </template>
      <V4Button v-if="from=='DETAIL' || from=='COLLECTION'"  mode="icon" @click="shareClicked" :id="`share-${hit.identifier}`"
         :aria-label="`copy link to ${hit.header.title}`"
      >
         <i class="share fal fa-share-alt"></i>
      </V4Button>
      <div class="bm-control">
         <AddBookmark v-if="isSignedIn" :data="$utils.toBookmarkData(pool,hit,from)" :id="`bm-modal-${hit.identifier}`"/>
         <SignInRequired v-else  :data="$utils.toBookmarkData(pool,hit,from)" :id="`bm-modal-${hit.identifier}`" act="bookmark" />
      </div>
   </div>
</template>

<script>
import AddBookmark from '@/components/modals/AddBookmark'
import SignInRequired from '@/components/modals/SignInRequired'
import Citations from '@/components/modals/Citations'
import { mapGetters } from "vuex"
export default {
   props: {
      hit: {
         type: Object,
         required: true
      },
      pool: {
         type: String,
         required: true
      },
      from: {
         type: String,
         default: ""
      },
   },
   components: {
      AddBookmark,SignInRequired,Citations
   },
   computed: {
      ...mapGetters({
        isSignedIn: 'user/isSignedIn',
      }),
      showCitations() {
         if (this.from.toUpperCase() == 'SEARCH' || this.from.toUpperCase() == 'COLLECTION') {
            return true
         }
         return false
      },
   },
   methods: {
      shareClicked() {
         this.$analytics.trigger('Results', 'SHARE_ITEM_CLICKED', this.hit.identifier)
         let URL = window.location.href
         this.$copyText(URL).then( ()=> {
            this.$store.commit("system/setMessage", "Item URL copied to clipboard.")
         }, e => {
            this.$store.commit("system/setError", "Unable to URL to clipboard: "+e)
         })
      }
   }
}
</script>

<style lang="scss" scoped>
.icon-wrap {
   display: flex;
   flex-flow: row nowrap;
   margin-left: auto;
   align-content: center;
   i.share {
      color: #444;
      cursor: pointer;
      font-size: 1.4em;
      display: inline-block;
      box-sizing: border-box;
      margin-right: 5px;
      padding:0;
      &:hover {
         color:var(--uvalib-brand-blue-light);
      }
   }
}
.citation-control {
   padding: 5px;
}
.bm-control {
   padding: 5px;
}
</style>
