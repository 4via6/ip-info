FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy website files
COPY . /usr/share/nginx/html/

# Remove unnecessary files
RUN rm /usr/share/nginx/html/Dockerfile \
    /usr/share/nginx/html/docker-compose.yml \
    /usr/share/nginx/html/.github \
    /usr/share/nginx/html/nginx.conf

# Expose port 80
EXPOSE 80
