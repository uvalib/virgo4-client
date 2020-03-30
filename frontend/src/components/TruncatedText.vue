<template>
   <div class="truncated-text">
      <div class="content"  @click="textClicked" @mouseover="mouseOver" @mouseleave="mouseLeave">
         <router-link v-if="tgtURL" :to="tgtURL">
            <div v-html="truncatedText"></div>
         </router-link>
         <div v-else v-html="truncatedText"></div>
      </div>
      <v-popover v-if="isTruncated" class="full" :open="showFull">
         <i v-if="trigger!='click'" class="icon fas fa-chevron-circle-down"
            @click="textClicked" @mouseover="mouseOver" @mouseleave="mouseLeave"></i>
         <i v-else class='trigger click more'>More</i>
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
      },
      trigger: {
         type: String,
         default: "click"
      }
   },
   data: function() {
      return {
         showFull: false
      }
   },
   computed: {
      isTruncated() {
         let test = this.truncatedText
         return this.text != test
      },
      truncatedText() {
         if (this.text.length <= this.limit) return this.text
         var trunc = this.text.substr(0, this.limit-1)
         var out = trunc.substr(0, trunc.lastIndexOf(' ')).trim()
         return out+"... "
      }
   },
   methods: {
      textClicked() {
         if ( this.trigger == "hover") {
            this.showFull = !this.showFull
         }
      },
      mouseOver() {
         if ( this.trigger == "hover") {
            this.showFull = true
         }
      },
      mouseLeave() {
         if ( this.trigger == "hover") {
            this.showFull = false
         }
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
   word-break: break-word;
   -webkit-hyphens: auto;
   -moz-hyphens: auto;
   hyphens: auto;
   cursor: default;
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

   max-width: 350px;
}
i.close {
   font-size: 1.1em;
   float:right;
}
i.icon {
   font-size: 1.2em;
   margin-left: 2px;
   color: var(--uvalib-grey-light);
}
</style>
