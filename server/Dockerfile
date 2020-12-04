FROM node:alpine
WORKDIR /server
ADD .. /server
RUN npm i
ENTRYPOINT node ./bin/www
