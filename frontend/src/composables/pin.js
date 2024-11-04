import { onMounted, ref, watch } from 'vue'
import { useWindowScroll, useElementBounding } from '@vueuse/core'

export function usePinnable( pinID, alertsID, scrollID, footerID ) {
   const { y } = useWindowScroll()
   const main = ref()
   const alerts = ref()
   const footer = ref()
   const toolbar = ref(null)
   const toolbarBounds = ref()
   const pinnedY = ref(-1)

   watch(y, (newY) => {
      if ( pinnedY.value < 0) {
         if ( toolbarBounds.value.top <= 0 ) {
            pinnedY.value = y.value+toolbarBounds.value.top
            toolbar.value.classList.add("sticky")
            toolbar.value.style.width = `${toolbarBounds.value.width}px`
            main.value.style.top = `${toolbarBounds.value.height}px`
            if ( alerts.value ) {
               alerts.value.style.top = `${toolbarBounds.value.height}px`
            }
            footer.value.style.top = `${toolbarBounds.value.height}px`
         }
      } else {
         if ( newY <=  pinnedY.value) {
            pinnedY.value = -1
            toolbar.value.classList.remove("sticky")
            toolbar.value.style.width = `auto`
            if ( alerts.value ) {
               alerts.value.style.top = `auto`
            }
            main.value.style.top = `auto`
            footer.value.style.top = `auto`
         }
      }
   })

   onMounted( () => {
      alerts.value = document.getElementById(alertsID)
      main.value = document.getElementById(scrollID)
      footer.value = document.getElementById(footerID)
      toolbar.value = document.getElementById(pinID)
      toolbarBounds.value = useElementBounding( toolbar )
   })

   return {}
}