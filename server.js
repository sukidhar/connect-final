const express = require('express');
const path = require('path')

const app = express();

app.use(express.static("./dist/connect-final"))

app.get('/' , (req , res)=>{
   res.sendFile('index.html',{root:'dist/connect-final'})
})

app.listen(process.env.PORT || 8000);