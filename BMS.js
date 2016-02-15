module.exports = function(chatter) {
  //load dependency
  var cloudinary = require("cloudinary");

  //Plugin enabled function
  this.onEnable = function() {

    //Load images config
    var config = chatter.getConfig(this, __dirname + "/images.json");
    //Setup the default user image if not data is in config
    config.setup({"defaultImage": "https://www.drupal.org/files/profile_default.jpg"});
    //Load config holding API keys for cloudinary and set to cloudinary config
    var cloud = chatter.getConfig(this, __dirname + "/cloudinary.json");
    cloudinary.config({
        cloud_name: cloud.get("name"),
        api_key: cloud.get("key"),
        api_secret: cloud.get("secret"),
    });

    //Setup listener from client users for image uploads
    chatter.listenToAll("ProfileImage", function(user, data) {
      //Send image to cloudinary and parse for right size url
      cloudinary.uploader.upload(data.image, function(result) {
        console.log("New profile image uploaded: ", user);
        var splits = result.secure_url.split("/");
        splits[splits.length - 2] = "w_44,h_44,c_fill";
        //Save url in config
        config.set(user.name, splits.join("/"));
        console.log("Saved at " + splits.join("/"));
        //save config in long term storage
        config.save();
      });
    });

    //Set up listener for when a message is added to a channel
    chatter.pluginManager.registerEvent(this, "MessageAddEvent", function(event) {
        //Get the most recent message from channel
        var last = event.channel.mostRecent();
        //If we have no message last message or last message is not same user add image to message
        if(!last || last.user !== event.message.user) {
          var image = config.get(event.message.user);
          //if we have an image in config use that one for message or use default
          if(image) {
            event.message.showImage = image;
          } else {
            event.message.showImage = config.get("defaultImage");
            config.set(event.message.user, config.get("defaultImage"));
            config.save();
          }
        }
    });

  };

};
