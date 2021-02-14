const express = require('express');
const fs = require('fs')
const async = require("async");
const get = require("async-get-file");
const Json2csvParser = require('json2csv').Parser
var csv = require("csvtojson");
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Bot is online!'));

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

// ================= START BOT CODE ===================
const Discord = require('discord.js');
const client = new Discord.Client();

const getMembers = async function(message)  {
    console.log(message)
    let allMembers = []
    await message.guild.members.cache
    .forEach(m =>{
      if (m.user.bot === false) {
        let member = {
            Name: m.user.username,
            Tag: m.user.tag,
            UserID: m.user.id,
            Bot: m.user.bot
        }
      allMembers.push(member)
      } 
    });
    return allMembers;
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
client.on('message', async msg => {
  var reply = "";
  if (msg.content === '!getMembers') {
    var allMembers = await getMembers(msg);
    for(const member of allMembers){
      reply = reply.concat("\n"+member.user.username+"-->"+member.user.id+"-->isBot?="+member.Bot);
    } 
    msg.reply(reply);
  }
  if (msg.content === '!getBotMembers') {
    var allMembers = await getMembers(msg);
    allMembers.filter(member => member.Bot===true)
    .forEach(member =>{reply = reply.concat("\n"+member.user.username);}); 
    msg.reply(reply);
  }
  if (msg.content === '!getRealMembers') {
    var allMembers = await getMembers(msg);
    allMembers.filter(member => member.Bot===flase)
    .forEach(member =>{reply = reply.concat("\n"+member.user.username);}); 
    msg.reply(reply);
  }
  if (msg.content === '!notifyDefaulters') {
    msg.guild.members.cache.filter(member => !member.user.bot)
    .forEach(member =>
    {
      member.user.send('please pay !');
    });
  }
  if (msg.content === '!exportMembers') {
    if (fs.existsSync('./members.csv')) {
      fs.unlinkSync('./members.csv')
    }
    var allMembers = await getMembers(msg);
    const json2csvParser = new Json2csvParser()
    const csv = json2csvParser.parse(allMembers)
    fs.writeFileSync(`members.csv`, csv, {flag: 'w'}, function(err){
        if (err) consoleLog('Error saving CSV file:' + err.message, "ERR")
    })
    msg.reply({files: ['./members.csv']});
  }
  if (msg.content === '!getDefaulters') {
      if (msg.attachments.size === 1) {
      var allMembers = await getMembers(msg);
      var attachment = msg.attachments.first();
      var attachmentname = attachment.name;
      await msg.reply("recieved - " + attachmentname);
      if (fs.existsSync(attachmentname)) {
          console.log("deleteing existing")
          fs.unlinkSync(attachmentname)
      }
      var options = {
        directory: "./",
        filename: attachmentname
      }
      await get(attachment.url,options);
      console.log("Success");
      const jsonArray=await csv().fromFile("./"+attachmentname);      
      console.log(jsonArray);
      let paidMembers = []
      let paidMembersIds =[]
      jsonArray
      .filter(transaction => transaction["To Email Address"]===process.env.TO_EMAIL)
      .filter(transaction => transaction.Note.length >0)
      .forEach(transaction=>{
        let member = {
            Name: transaction.Name,
            UserID: transaction.Note
        }
        paidMembers.push(member);
        paidMembersIds.push(transaction.Note);
      })
      //console.log("allmembers");
      //console.log(allMembers);
      //console.log("paid");
      //console.log(paidMembers);
      //console.log(paidMembersIds);
      var defaulterList = "\n"+"defaulters are -"+"\n"
      allMembers.filter(member => !paidMembersIds.includes(member.UserID)).forEach( member=>
        {defaulterList = defaulterList + member.Name + "\n"}
      );
      await msg.reply(defaulterList);
    }else{
       await msg.reply("!getDefaulters command expects single csv attchment file with list of memberIDs who has paid");
    } 
  }
});

client.login(process.env.DISCORD_TOKEN);