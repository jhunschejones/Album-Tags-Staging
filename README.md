# Album-Tags-Staging

## Overview:
This repository contains a staging version of the Album Tags application that is used to test code base refactoring and new features before pushing code to the main site. Depending on the features being tested, the staging version of Album Tags can often be viewed live at https://album-tags-staging.herokuapp.com/.

## Curent Work:
Starting March 12, 2019 this repo will contain progress towards my stretch project of rebuilding the database layer of Album Tags using Sequlize. There is a chance this code will not ever fully replace the current Mongoose database layer, but after some successful smaller-scale testing it was time to try the idea in an environment closer to production.

## Docker:
To build and run in a docker container:
1. `docker build -t album_tags_staging .` 
2. `docker run -p 3000:3000 -d album_tags_staging`
BONUS: to pass in env file seperately, run `docker run -e ./.env -p 3000:3000 -d album_tags_staging`

To run using docker-compose
1. `docker-compose build`
2. `docker-compose up`
NOTE: docker compose is currently configured to always start in development