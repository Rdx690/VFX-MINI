# Official Node.js Base Image
FROM node:20-slim

# Git, FFmpeg आणि आवश्यक tools इन्स्टॉल करा
RUN apt-get update && apt-get install -y \
    git \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Working Directory Set करा
WORKDIR /app

# Dependencies Copy करा
COPY package*.json ./

# Production install
RUN npm install --production

# बाकी सर्व Project Files Copy करा
COPY . .

# Bot Start करा
CMD ["npm", "start"]
