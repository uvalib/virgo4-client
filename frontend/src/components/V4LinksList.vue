<template>
   <div :id="id" class="links-list">
      <ol v-if="links.length < 5" class="link-list">
         <li  v-for="(val,idx) in links" :key="`${linkType}-${idx}`">
            <router-link :to="val.url">
               {{val.label}}
            </router-link>
         </li>
      </ol>
      <button v-else tabindex="0" :aria-expanded="showFull.toString()" :aria-controls="`${id}-list`" 
            @click.prevent.stop="toggle" @keyup.stop.prevent @keydown.prevent.stop.enter="toggle" 
            @keydown.space.prevent.stop="toggle" @keyup.stop.esc="hide"
      >
         <ol :id="`${id}-list`">
            <li  v-for="(val,idx) in truncatedLinks" :key="`${id}-${idx}`">
               <router-link :to="val.url">
                  {{val.label}}
               </router-link>
            </li>
            <div class="controls">
               <span v-if="!showFull" class="more">...More ({{links.length}} items)</span>
               <span v-else class="less">...Less</span>
            </div>
         </ol>
      </button>
   </div>
</template>

<script>
export default {
   props: {
      id: {
         type: String,
         required: true
      },
      links: {
         type: Array,
         required: true
      },
   },
   data: function()  {
      return {
         showFull: false
      }
   },
   computed: {
      truncatedLinks() {
         if ( this.showFull ) {
            return this.links
         }
         return this.links.slice(0,5)
      }
   },
   methods: {
      hide() {
         this.showFull = false
         this.$nextTick( () => {
            let tgt = document.getElementById(this.id)
            console.log("scroll to "+tgt)
            tgt.scrollIntoView()
         })
      },
      toggle() {
         this.showFull = !this.showFull
         if ( this.showFull == false ) {
             this.$nextTick( () => {
               let tgt = document.getElementById(this.id)
               console.log("scroll to "+tgt)
               tgt.scrollIntoView({behavior: "smooth"})
            })
         }
      },
   }
}
</script>

<style lang="scss" scoped>
.links-list {
   ol {
      margin: 0;
      padding: 0 0 0 40px;
   }
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
   }
   .controls {
      text-align: right;
      margin-top: 10px;
      .more, .less {
         color: var(--color-link);
         cursor: pointer;
         margin-left: 0px;
         font-weight: 500;
         margin-left: 5px;
         font-size: 0.9em;
         &:hover {
            text-decoration: underline;
         }
      }
   }
}
</style>

