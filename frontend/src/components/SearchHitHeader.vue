<template>
   <div class="header-wrapper">
      <div class="title-wrapper">
         <div class="full-title">
            <span class="count-wrap" v-if="count">
               <span class="count">{{count}}</span>
            </span>
            <template v-if="link == false">
               <span class="hit-title" v-html="hit.header.title"></span>
               <span v-if="hit.header.subtitle" class="hit-subtitle" v-html="hit.header.subtitle"></span>
            </template>
            <router-link @mousedown.native="detailClicked" v-else :to="detailsURL">
               <span class="hit-title" v-html="hit.header.title"></span>
               <span v-if="hit.header.subtitle" class="hit-subtitle" v-html="hit.header.subtitle"></span>
            </router-link>
         </div>
         <div class="icon-wrap">
            <div class="citation-control">
               <Citations title="Citations" :id="`citation-${hit.identifier}`" style="margin-right: 10px"
                  :itemURL="hit.itemURL" format="all" :from="from" :ariaLabel="`citations for ${hit.identifier}`" >
               </Citations>
            </div>
            <div class="bm-control">
               <AddBookmark v-if="isSignedIn" :hit="hit" :pool="pool" :id="`bm-modal-${hit.identifier}`"/>
               <SignInRequired v-else  :hit="hit" :id="`bm-modal-${hit.identifier}`" act="bookmark" />
            </div>
         </div>
      </div>
      <div v-if="hit.header.author_display" class="author-wrapper">
         <div v-if="hit.header.author" class="author">
            <TruncatedText :id="`${hit.identifier}-author`"
               :text="hit.header.author_display" :limit="authorTruncateLength" />
         </div>
      </div>
   </div>
</template>

<script>
import AddBookmark from '@/components/modals/AddBookmark'
import SignInRequired from '@/components/modals/SignInRequired'
import TruncatedText from '@/components/TruncatedText'
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
      link: {
         type: Boolean,
         default: true
      },
      count: {
         type: Number,
         default: 0
      },
      from: {
         type: String,
         default: ""
      },
   },
   components: {
      AddBookmark,SignInRequired,TruncatedText,Citations
   },
   computed: {
      ...mapGetters({
        isSignedIn: 'user/isSignedIn',
      }),
      detailsURL() {
         return `/sources/${this.pool}/items/${this.hit.identifier}`
      },
      authorTruncateLength() {
         return 150
      },
   },
   methods: {
      detailClicked() {
         this.$store.commit("hitSelected", this.hit.identifier)
         this.$analytics.trigger('Results', 'DETAILS_CLICKED', this.hit.identifier)
      },
   }
}
</script>

<style lang="scss" scoped>

.title-wrapper {
   text-align: left;
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-start;
   .hit-title {
      font-weight: bold;
      display: inline-block;
      margin-right: 5px;
   }
   .hit-subtitle {
      display: inline-block;
      font-weight: normal;
   }
   .full-title {
      font-size: 1.25em;
      display:flex;
      flex-flow: row nowrap;
      align-items: flex-start;
      justify-content: flex-start;
   }

   .count-wrap {
      display: flex;
      flex-flow: row nowrap;
      margin-top: 2px;
      margin-right: 5px;
      align-items: baseline;

      .count {
         display: inline-block;
         font-size: 0.7em;
         color: var( --uvalib-grey );
      }
   }
   .icon-wrap {
      display: flex;
      flex-flow: row nowrap;
      margin-left: auto;
   }
   .citation-control {
      padding: 5px;
   }
   .bm-control {
      padding: 5px;
   }
}

.author-wrapper {
   text-align: left;
   padding-left: 40px;
   padding-top: 5px;
   padding-bottom: 10px;
}
</style>
