<template>
   <div :id="id" class="truncated-text">
      <div v-if='isTruncated==false'>
         <div v-html="truncatedText"></div>
      </div>
      <template v-else>
         <button v-if="!showFull" tabindex="0" :aria-expanded="showFull" :aria-controls="`${id}-full`" 
            @click.prevent.stop="toggle" @keyup.stop.prevent @keydown.prevent.stop.enter="toggle" 
            @keydown.space.prevent.stop="toggle" @keyup.stop.esc="hide"
            class="truncated-content" :id="`${id}-cut`" :title="text"
            :class="{icon: mode=='icon'}"
         >
            <span class="text">{{truncatedText}}</span>
            <span  v-if="mode=='text'" class="more">...&nbsp;More</span>
            <span  v-else class="more icon">...</span>
         </button>
         <button v-if="showFull" :id="`${id}-full`" class="full-text" tabindex="0" :class="{icon: mode=='icon'}"
            @click.prevent.stop="toggle" @keyup.stop.prevent @keydown.prevent.stop.enter="toggle" 
            @keydown.space.prevent.stop="toggle" @keyup.stop.esc="hide"
         >
            <span class="text">{{text}}</span>
            <span  v-if="mode=='text'" class="less" :id="`${id}-less`">...&nbsp;Less</span>
            <span v-else class="less icon" :id="`${id}-less`">Less</span>
         </button>
      </template>
   </div>
</template>

<script>
export default {
   props: {
      text: {
         type: String,
         required: true,
      },
      limit: {
         type: Number,
         default: 80
      },
      mode: {
         type: String, 
         default: "text"
      },
      id: {
         type: String,
         required: true
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
         return out
      }
   },
   methods: {
      hide() {
         this.showFull = false
         this.$nextTick( () => {
            let tgtID = `${this.id}-cut`
            let ele = document.getElementById( tgtID )
            if (ele) {
               ele.focus()
            }
         })
      },
      toggle() {
         this.showFull = !this.showFull
         this.$nextTick( () => {
            let tgtID = `${this.id}-full`
            if ( this.showFull == false) {
               tgtID = `${this.id}-cut`
            }
            let ele = document.getElementById( tgtID )
            if (ele) {
               ele.focus()
            }
         })
      },
   }
}
</script>

<style lang="scss" scoped>
.full-text {
   background: white;
}
.full-text.icon {
   padding: 5px 18px 5px 5px;
   position: relative;
   top: 0px;
   left: -5px;
   z-index: 999;
   width: 100%;
   box-sizing: border-box;
   background: white !important;
   border: 1px solid var(--uvalib-grey);
   box-shadow: $v4-box-shadow;
   i {
      position: absolute;
      right: 5px; 
      top: 5px;
   }
}
.truncated-text {
   font-size: 1em;
   font-weight: normal;
   display: inline-block;
   text-align: left;
   position: relative;
   box-sizing: border-box;

   button {
      display: inline-block;
      word-break: break-word;
      -webkit-hyphens: auto;
      -moz-hyphens: auto;
      hyphens: auto;
      cursor: default;
      background: transparent;
      border: none;
      margin: 0;
      padding: 0;
      text-align: left;
      width: 100%;
      box-sizing: border-box;
      &:focus {
         @include be-accessible();
      }
      i {
         position: absolute;
         right: 5px; 
         top: 5px;
      }
   }
   .truncated-content.icon:hover {
      text-decoration: underline;
      cursor: pointer;
   }

   .full-text {
      text-align: left;
      &:focus {
         @include be-accessible();
      }
   }
    .full-text.icon {
      outline: none;
      cursor: pointer;
      &:focus {
         background-color: var(--uvalib-teal-lightest)!important;
         color: var(--uvalib-text-dark);
      }
   }

   .more, .less {
      color: var(--color-link);
      cursor: pointer;
      margin-left: 0px;
      font-weight: 500;
      margin-left: 5px;
      font-size: 0.9em;
   }
   .more.icon  {
       color: var( --uvalib-text);   
       margin-left: 0px;
   }
   .more:hover, .less:hover {
      text-decoration: underline;
   }
}

</style>
