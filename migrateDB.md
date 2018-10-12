# Migrating from m-lab to MongoDB Atlas

1. Install homebrew `/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"`
2. Install mongodob, `brew install mongodb`
3. Use the mongo import tool: `mongoimport --host Album-Tags-shard-0/album-tags-shard-00-00-qntxy.mongodb.net:27017,album-tags-shard-00-01-qntxy.mongodb.net:27017,album-tags-shard-00-02-qntxy.mongodb.net:27017 --ssl --username joshua --password <PASSWORD> --authenticationDatabase admin --db Album-Tags --collection album-tags --type JSON --file tags.json --jsonArray`

#### Notes:
* Replace `<PASSWORD>` in the mongo import script with Atlas admin user password
* `tags.json` in the mongo import tool is my data source, a JSON export of the previous database pulled through my API
* Passing the `--jsonArray` flag is required if the JSON file you are passing in is an array of objects