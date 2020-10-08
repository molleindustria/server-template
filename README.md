# Advanced Server Template

This example is barebone on the client side - it's a simple chat that doesn't use p5 or any other libraries - but it includes a few technically complex features on the server side:

* rudimentary admin system: logging as username|password you are tagged as administrator and able to perform special actions (ban, mute, kick, etc)
* admin user and passwors stored in an .env private file
* admin names are reserved and the server checks for duplicate names
* players' IPs can be banned 
* anti-spam system preventing too many messages from being sent by the same client
* server-side anti-flood system, if too many packets per second are detected the IP gets automatically banned (malicious attack)
* events are wrapped in try/catch statements to prevent hacked clients from crashing the server
* all text messages and user names are filtered against a list of banned words
* inactive players are disconnected after a certain time
* system to detect when the players are away from keyboard (AFK), their tabs are inactive
* system to check that the client and server versions are aligned
* client-side quick login option that assigns a random username and automatically logs in to speed up the testing
* a basic data structure for unchangeable data (data.js on the server side)


## The .env file

.env is a text file in the root folder that contains private variables, in this case admin usernames and passwords and the port used by the project. It's not published on github and it's not automatically published on glitch so you may have to create it manually and/or copy paste the content in the glitch editor and/or in your code editor if you are running is as a local project.

An example of .env file for LIKELIKE online is:

```javascript
ADMINS=adminname1|pass1,adminname2|pass2  
PORT = 3000
```

The admin names are reserved. Logging in as "adminname|pass" (nickname and password separated by a "|") will grant the user admin priviledges such as banning IP or sending special messages.

