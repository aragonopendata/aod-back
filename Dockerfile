FROM node:14.0.0-buster

RUN mkdir /app && \
    chown -R node:node /app

WORKDIR /app
COPY package*.json .
RUN npm install
#RUN rm -r node-modules

COPY src /app

USER node
CMD [ "node", "server.js" ]

