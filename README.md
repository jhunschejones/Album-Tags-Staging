# Album-Tags-Staging
This is a staging code-base for albumtags.com that is used to test larger site changes before pushing to the main repository. The main albumtags.com repository can be found [here](https://github.com/jhunschejones/album-tags).

### Updates 10/06/18
1. All the routes for the app have been refactored. Database and external calls have been pulled out of the routes for each page and placed in the `api.v1.route.js` route. All client JavaScript files have been updated with the new endpoints. This allows for removal of some duplicate code and easier updates for future backend changes.
2. The `require(‘newrelic’)` statement has been moved up from the app.js file into the `www` file so that it is the first package when Heroku calls `npm start`.
3. The `www` file was updated with Cluster functionality. The app should now serve up one version of the backend per CPU available. This should help handle multiple site requests better and make better use of the multi-core resources available on the Heroku dyno. There is a chance it will affect how data reports to New Relic, as well as database calls, so we are only deploying this in the staging code-base to start with.