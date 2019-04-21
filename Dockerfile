FROM node:10-alpine

WORKDIR /usr/src/app

RUN apk --no-cache add python

COPY package*.json ./
RUN npm install

COPY . . 

EXPOSE 3000

CMD [ "npm", "start" ]
