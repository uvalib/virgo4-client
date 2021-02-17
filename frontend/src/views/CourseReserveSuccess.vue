<template>
   <div class="reserved">
      <div class="messages">
         <h2>Thank you for your course reserves request!</h2>
         <p>A copy of your request has been emailed to you.</p>
         <p>If we have questions regarding your request someone will contact you.</p>
         <p>When your request has been processed, you'll be able to see your non-video
            reserves by signing into your Virgo account and clicking the Course Reserves menu option.</p>
         <p>
            If the Library doesn’t own an item that you need for reserve, you may make a
            <a href="https://www.library.virginia.edu/services/purchase-requests/" target="_blank">purchase recommendation</a>.
         </p>
         <p>
            If you have personal copies of items to be placed on reserve, please complete our
            <a href="https://www.library.virginia.edu/services/course-reserves/personal/" target="_blank">Personal Copy Form</a>
            and bring a print out of the email confirmation with the items.
         </p>
      </div>
   </div>
</template>

<script>
export default {
   name: "reserved",
}
</script>

<style scoped>
.reserved {
   min-height: 400px;
   position: relative;
   margin: 25px 0 50px 0;
}
.messages {
   width:40%;
   margin: 5px auto 30px auto;
   color: #444;
   font-size: 1.1em;
   text-align: left;
}
</style>

