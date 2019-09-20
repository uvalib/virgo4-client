<template>
   <div @click="closeGroupedResults" class="grouped-results-overlay"> 
      <div @click="blockClick" class="grouped-results-modal">
         <div id="more-header" class="more-header">
            <div  @click="closeGroupedResults"  class="overlay-title">
               <i class="group-icon fas fa-layer-group"></i>
               <span class="pool-name">{{groupTitle}}</span>
               <i class="pool-close fas fa-times-circle"></i>
            </div>
         </div>
         <div class="hits" id="hits-scroller">
            <div class="summary">{{groupDetails.items.length}} items in group</div>
            <template v-for="(hit,idx) in groupDetails.items">
               <SearchHit :pool="groupDetails.pool" :hit="hit" :key="idx"/>
            </template>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import SearchHit from "@/components/SearchHit"
export default {
   components: {
      SearchHit
   },
   computed: {
      ...mapState({
         groupDetails: state=>state.groupDetails,
      }),
      groupTitle() {
         let title = ""
         this.groupDetails.metadata.some( md => {
            if (md.name == "title") {
               title = md.value
            }
            return title != ""
         })
         return title
      }
   },
   methods: {
      blockClick(event) {
        event.stopPropagation() 
      },
      closeGroupedResults() {
         this.$store.commit("clearGroup")
      },
      handleKeyUp(evt) {
         if (evt.keyCode === 27) {
            evt.stopPropagation()
            this.closeGroupedResults()
         }
      }
   },
   created() {
      document.addEventListener('keyup', this.handleKeyUp )
   },
   destroyed() {
      document.removeEventListener('keyup', this.handleKeyUp )
   }
}
</script>

<style scoped>

.grouped-results-overlay {
   position: fixed;
   left: 0;
   top: 0;
   bottom: 0;
   right: 0;
   z-index: 2000;
}
.group-icon {
   margin: 0 8px 0 2px;
}
.grouped-results-modal {
   position: fixed;
   right: 0;
   top: 0;
   bottom: 0;
   background: var(--color-primary-blue);
   box-sizing: border-box;
   border-left: 5px solid var(--color-primary-blue);
   box-shadow: -2px 0px 10px #333;
   z-index: 2005;
}
@media only screen and (min-width: 768px) {
   .grouped-results-modal, .grouped-results-modal, div.more-header {
      left: 50%;
   }
}
@media only screen and (max-width: 768px) {
   .grouped-results-modal, .grouped-results-modal, div.more-header {
      left: 10%;
   }
}
div.more-header {
   cursor: pointer;
   position: absolute;
   right:0;
   left: 0;
   font-size: 1em;
   color: white;
   background: var(--color-primary-blue);
   margin:0;
   text-align: left;
   border-bottom: 5px solid var(--color-primary-blue);
   border-top: 4px solid var(--color-primary-blue);
   z-index: 2020;
}
div.overlay-title {
   display: flex;
   flex-flow: row wrap;
   align-items: center;
   padding: 3px 8px 3px 2px;
}
.pool-name {
   font-weight: bold;
   flex: 1 1 auto;
}
.pool-close { 
   font-size: 1.5em;
   cursor: pointer;
}
.summary {
   text-align: left;
   padding: 5px 10px;
   border-bottom: 1px solid #ccc;
   border-left: 1px solid #ccc;
   background-color: #eee;
}
.hits {
   position: absolute;
   top: 40px;
   left: 0;
   right: 0;
   bottom: 0;
   overflow: auto;
   overscroll-behavior: contain;
   color: #555;
   z-index: 2010;
   background-color: white;
}
.bottom {
   background-color: var(--color-primary-blue);
   color: white;
   padding: 2px;
   text-align: center;
}
</style>
