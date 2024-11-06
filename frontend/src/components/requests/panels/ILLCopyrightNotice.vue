<template>
  <div class="notice" :class="{wide: props.wide==true}">
    <template v-if="props.type == 'research'">
      <p class="head">
        <strong>Important Copyright Information<br/>
        NOTICE OF WARNING CONCERNING COPYRIGHT RESTRICTIONS
        </strong>
      </p>
      <div class="content">
        <p>
          The copyright law of the United States (Title 17, United States Code) governs the making of
          photocopies or other reproductions of copyrighted materials.
        </p>
        <p>
          Under certain conditions specified in the law, libraries and archives are authorized to
          furnish a photocopy or other reproduction. One of these specified conditions is that the
          photocopy or reproduction is not to be "used for any purpose other than private study, scholarship, or research".
          If a user makes a request for, or later uses, a photocopy or reproduction for purposes in excess of "fair use",
          that user may be liable for copyright infringement.
        </p>
        <p>
          This institution reserves the right to refuse to accept a copying order if, in its judgment,
          fulfillment of the order would involve violation of copyright law.
        </p>
      </div>
    </template>

    <template v-else-if="props.type == 'instruction'">
      <p class="head">
        <strong>Important Copyright Information<br/>
          NOTICE OF WARNING CONCERNING COPYRIGHT RESTRICTIONS
        </strong>
      </p>
      <div class="content">
        <p>
          N.B. Copyright law is complex, but the Library uses the following rules of thumb in vetting requests:
        </p>
        <p>
          Materials which may be scanned for posting to Canvas for a course without obtaining copyright permissions:
        </p>
        <ul>
          <li>One chapter from a book</li>
          <li>One article from a journal issue</li>
          <li>Government publications</li>
          <li>Exams, homework solutions, lecture notes, etc., created by you</li>
          <li>Anything for which you own the copyright</li>
          <li>Anything in the public domain</li>
        </ul>
        <p>
          If you wish to go outside of these guidelines and you believe your use is fair, please consult our page about
          <a href="https://copyright.library.virginia.edu/user-rights-and-responsibilities/classroom-scanning/" target="_blank">copyright and instructional scanning</a>
          and contact our Director of Information Policy to learn more about how to apply fair use to your request. If your request exceeds
          our rules and is not otherwise fair use, you must obtain copyright permission from the publisher of the journal or book.
          Many academic publishers use the
          <a href="https://marketplace.copyright.com/rs-ui-web/mp" target="_blank">Copyright Clearance Center</a> (CCC) to manage permissions requests.
          The University's policy on Adherence to Copyright Protections is available
          <a href="https://uvapolicy.virginia.edu/policy/GOV-005" target="_blank">here</a>.
          This institution reserves the right to refuse to accept a copying order if,
          in its judgment, fulfillment of the order would involve violation of copyright law.
        </p>
        <p>
          SUBMISSION OF THIS REQUEST IS CONFIRMATION THAT you understand the University's Policy on Copying of Copyrighted Material,
          and that the material requested for reserve either complies with these guidelines or it may be copied because you have
          received written permission from the copyright holder.
        </p>
        <p>
          Instructors are responsible for compliance with copyright law.
        </p>
      </div>
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
    type: {
      validator: (value)=>{
        return ['instruction', 'research'].indexOf(value) !== -1
      }
    },
    wide: {
      type: Boolean,
      default: false
    }
})
</script>
<style lang="scss" scoped>
.notice {
   font-size:1em;
   padding: 0;
   border: 1px solid $uva-red-A;
   margin: 0 auto;
   p {
      margin: 0;
   }
   p.head {
      margin: 0;
      padding: 5px 15px;
      background: $uva-red-100;
      border-bottom: 1px solid $uva-red-A;
   }
   .content {
     padding: 15px;
     ul {
      margin:0;
    }
   }
}
.notice.wide {
  width: auto;
}
@media only screen and (min-width: 768px) {
  .notice {
    width: 600px;
  }
}
@media only screen and (max-width: 768px) {
  .notice {
    width: auto;
  }
}
</style>