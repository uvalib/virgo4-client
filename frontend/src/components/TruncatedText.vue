<template>
   <div class="truncated-text">
      <div class="content">
         <router-link v-if="tgtURL" :to="tgtURL">
            <div v-html="truncatedText"></div>
         </router-link>
         <div v-else v-html="truncatedText"></div>
      </div>
      <v-popover v-if="isTruncated" class="full" :show="test">
         <i class='trigger click more'>More...</i>
         <div class="full-text-popover" slot="popover">
            <div v-if="title" class="popover-header">
               {{title}}
               <i v-close-popover class="close fas fa-times-circle"></i>
            </div>
            <div class="full-text" v-html="text"></div>
         </div>
      </v-popover>
   </div>
</template>

<script>
const truncate = require('html-truncate')
export default {
   props: {
      title: {
         type: String,
         default: "",
      },
      text: {
         type: String,
         required: true,
      },
      limit: {
         type: Number,
         default: 80
      },
      tgtURL: {
         type: String,
         default: ""
      }
   },
   computed: {
      isTruncated() {
         let test = this.truncatedText
         return this.text != test
      },
      truncatedText() {
         let out =  truncate(this.text, this.limit, { ellipsis: '' })
         if ( this.tgtURL) {
            console.log(`ORIG [${this.text}] vs [${out}]`)
         }
         return out
      }
   },
   methods: {
      test() {
         alert("hey")
      }
   }
}
</script>

<style scoped>
div.popover-header {
   padding: 5px;
   color: white;
   background-color: var(--uvalib-grey-dark);
   font-weight: 500;
   text-align: center;
}
.truncated-text {
   font-size: 1em;
   font-weight: normal;
}
.content {
   display: inline-block;
}
div.full {
   display: inline-block;
}
i.trigger.more {
   color: var(--color-link);
   cursor: pointer;
   margin-left: 10px;
   font-weight: 500;
   font-size: 0.8em;
}
i.trigger.more:hover {
   text-decoration: underline;
}
.full-text-popover {
   background: white;
   border: 1px solid #999;
   border-radius: 5px;
   box-shadow: 1px 1px 5px #999;
   border: 4px solid var(--uvalib-grey-dark);
   margin: 0 10%
}
.full-text {
   font-size: 0.95em;
   padding: 10px;
   line-height: 1.5em;
   font-weight: 100;
}
i.close {
   font-size: 1.1em;
   float:right;
}
</style>
