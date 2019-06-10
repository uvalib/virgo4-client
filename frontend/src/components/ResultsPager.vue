<template>
   <div class="pager">
      <i @click="firstPageClicked" v-bind:class="{disabled: isFirstPage}" class="button fas fa-angle-double-left"></i>
      <i @click="prevPageClicked" v-bind:class="{disabled: isFirstPage}" class="button fas fa-angle-left"></i>
      <span class="curr">{{ page+1 }} of {{ lastPage }}</span>
      <i @click="nextPageClicked" v-bind:class="{disabled: isLastPage}" class="button fas fa-angle-right"></i>
      <i @click="lastPageClicked" v-bind:class="{disabled: isLastPage}" class="button fas fa-angle-double-right"></i>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
export default {
   computed: {
      ...mapState({
         pageSize: state => state.pageSize,
      }),
      ...mapGetters({
         currPool: 'currPool'
      }),
      page() {
         return this.currPool.page
      },
      total() {
         return this.currPool.total
      },
      lastPage() {
         return  Math.floor( this.total / this.pageSize)+1
      },
      isFirstPage() {
         return this.page === 0
      },
      isLastPage() {
         return this.page === (this.lastPage-1)
      }
   },
   methods: {
      firstPageClicked(event) {
         if (event.currentTarget.classList.contains("disabled")) return
         this.$store.dispatch("firstPage")
      },
      lastPageClicked() {
         if (event.currentTarget.classList.contains("disabled")) return
         this.$store.dispatch("lastPage")
      },
      nextPageClicked() {
         if (event.currentTarget.classList.contains("disabled")) return
         this.$store.dispatch("nextPage")
      },
      prevPageClicked() {
         if (event.currentTarget.classList.contains("disabled")) return
         this.$store.dispatch("prevPage")
      }
   }
};
</script>

<style scoped>
.pager {
   font-size: 12px;
   float: right;
}
.total {
   margin-right: 10px;
   display: inline-block;
}
.button.fas {
   width: 20px;
   height: 12px;
   padding: 4px 0;
   text-align: center;
   margin: 1px;
   background: var(--color-primary-blue);
   color: white;
}
.button.fas:hover {
   cursor:  pointer !important;
   background: #1088f7;
}
.button.fas.disabled {
   cursor:default;
   opacity: 0.5;
}
.button.fas.disabled:hover {
   cursor:default;
   opacity: 0.5;
}
span.curr {
   display: inline-block;
   border: 1px solid #ccc;
   padding: 1px 10px;
   height: 16px;
   margin: 0 2px;
}
</style>