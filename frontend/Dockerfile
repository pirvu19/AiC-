FROM node:20-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm config set strict-ssl false && npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY certs/ /etc/nginx/certs/
ENV BACKEND_HOST=backend
ENV BACKEND_PORT=8080
ENV NOTIFICATION_SERVICE_HOST=notification-service
ENV NOTIFICATION_SERVICE_PORT=8082
EXPOSE 80 443
