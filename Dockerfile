# Use the official NGINX base image
FROM nginx:alpine

# Copy custom NGINX configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy website files into the NGINX html directory
COPY . /usr/share/nginx/html/

# Expose port 80 to allow traffic on this port
EXPOSE 80