FROM node:18-alpine3.15

WORKDIR /app

COPY package.json yarn.lock /app

RUN yarn --ignore-engines

COPY . /app

RUN NODE_ENV=production yarn build

CMD ["yarn", "start"]
