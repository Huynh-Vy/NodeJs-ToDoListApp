//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-vyhuynh:Test123@cluster0.vwjgb.mongodb.net/toDoListDB");

const itemSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item ({
  name: "Welcome to your to do list!"
});

const item2 = new Item ({
  name: "Hit the + button to add a new item"
});

const item3 = new Item ({
  name: "<--- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {
    if(foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("Insert default items successfully");
        }
      });
      res.redirect("/");
    } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.get("/:customList", function(req, res) {

  const customListName = _.capitalize(req.params.customList);


  List.findOne({name: customListName}, function(err, foundList) {
    if(!err) {
      if(!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();

        res.redirect("/" + customListName);
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

})

app.post("/", function(req, res){

  const itemName = req.body.newItem;

  const listName = req.body.list;

  const item = new Item ({
    name:  itemName
  })

  if(listName === "Today") {

    item.save();

    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const itemId = req.body.checkbox;
  const listname = req.body.listName;

  if(listname === "Today") {
    Item.deleteOne({_id: itemId}, function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("Delete item successfully");
      }
      });

      res.redirect("/");
    } else {
        List.findOneAndUpdate({name: listname}, {$pull: {items: {_id: itemId}}}, function(err, foundList) {
          if(!err) {
            res.redirect("/"+ listname)

          }
        })
    }

})


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
