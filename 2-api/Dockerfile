# creates a docker image with the specified name (template)
FROM node:14-alpine

# Copy files to the container
COPY package.json .
COPY tsconfig.json .
COPY package-lock.json .

COPY src src

RUN npm ci
RUN npm install -g typescript
RUN npm install -g ts-node
RUN npx tsc

CMD ["npm", "start"]