FROM mhart/alpine-node:8

WORKDIR /app
COPY . .

# RUN apk add --no-cache python make gcc g++
RUN npm install --production

CMD ["npm", "run", "start"]
