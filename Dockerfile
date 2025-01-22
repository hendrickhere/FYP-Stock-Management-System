FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV INITIALIZE_DB=false
ENV NODE_ENV=development
ENV PORT=3000
ENV OPENAI_API_KEY=dummy-key

EXPOSE 3000

CMD ["node", "myproject-backend/server.js"]