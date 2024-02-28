FROM node:alpine

# Update packages index and install git
RUN apk update && apk add git

# Create app directory
RUN mkdir /app
RUN mkdir /app/Yspotify
WORKDIR /app/Yspotify

# Create a run.sh file to pull the latest code from the repository
# then install the dependencies
# then update the dependencies
# then run the app
RUN echo "#!/bin/sh" > /app/run.sh
RUN echo "git pull" >> /app/run.sh
RUN echo "npm install" >> /app/run.sh
RUN echo "npm update" >> /app/run.sh
RUN echo "node app" >> /app/run.sh
RUN ["chmod", "+x", "/app/run.sh"]

# Clone the repository
RUN git clone https://github.com/Angelina974/Yspotify.git .

# Expose the port
EXPOSE 3000

# Run the app
ENTRYPOINT ["/app/run.sh"]