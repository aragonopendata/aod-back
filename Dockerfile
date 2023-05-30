FROM node:14.0.0-buster
COPY . . 

#RUN rm -r node-modules

RUN npm install 

CMD [ "node", "server.js" ]

