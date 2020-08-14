<template>
   <div class="header-wrapper">
      <div class="full-title">
         <span class="count-wrap" v-if="count">
            <span class="count">{{count}}</span><span v-if="subcount" class="count sub">.{{subcount}}</span>
         </span>
         <template v-if="link == false">
            <span class="hit-title" v-html="hit.header.title"></span>
            <span v-if="hit.header.subtitle" class="hit-subtitle" v-html="hit.header.subtitle"></span>
         </template>
         <router-link @click.native="detailClicked" v-else :to="detailsURL">
            <span class="hit-title" v-html="hit.header.title"></span>
            <span v-if="hit.header.subtitle" class="hit-subtitle" v-html="hit.header.subtitle"></span>
         </router-link>
      </div>
      <div class="bm-control">
         <AddBookmark v-if="isSignedIn" :hit="hit" :pool="pool" :id="`bm-modal-${hit.identifier}`"/>
         <SignInRequired v-else  :hit="hit" :id="`bm-modal-${hit.identifier}`" act="bookmark" />
      </div>
   </div>
</template>

<script>
import AddBookmark from '@/components/modals/AddBookmark'
import SignInRequired from '@/components/modals/SignInRequired'
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
      subcount: {
         type: Number,
         default: 0
      }
   },
   components: {
      AddBookmark,SignInRequired
   },
   computed: {
      ...mapGetters({
        isSignedIn: 'user/isSignedIn',
      }),
      detailsURL() {
         return `/sources/${this.pool}/items/${this.hit.identifier}`
      },
   },
   methods: {
      detailClicked() {
         this.$analytics.trigger('Export', 'DETAILS_CLICKED', this.hit.identifier)
      },
   }
}
</script>

<style lang="scss" scoped>
.header-wrapper {
   text-align: left;
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-start;
}

#app .basic a:hover {
   text-decoration: none;
   color: var(--color-link)
}

div.bm-control {
   margin-left: auto;
   padding: 5px;
}

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
   align-items: baseline;;

   .count {
      display: inline-block;
      font-size: 0.7em;
      color: var( --uvalib-grey );
   }
   .count.sub {
      font-size: 0.65em;
   }
}
</style>
