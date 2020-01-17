<template>
   <div class="reserved">
      <h1>Course Reserves Request</h1>
      <div class="messages">
         <p><b>Thank you for your course reserves request.</b><br/>A copy of your request has been emailed to you.</p>
         <p>If we have questions regarding your request someone will contact you.</p>
         <p>When your request has been processed, you'll be able to see your reserves by signing into your Virgo account 
            and clicking the Course Reserves menu option.</p>
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
   margin-top: 25px;
}
.messages {
   width:40%;
   margin: 5px auto 30px auto;
   color: #444;
   font-size: 1.1em;
   text-align: left;
}
</style>

