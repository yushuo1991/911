FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai

# 创建简化的package.json
RUN echo '{ \
  "name": "stock-tracker", \
  "version": "1.0.0", \
  "scripts": { \
    "dev": "next dev", \
    "build": "next build", \
    "start": "next start" \
  }, \
  "dependencies": { \
    "next": "14.2.32", \
    "react": "18.2.0", \
    "react-dom": "18.2.0", \
    "typescript": "5.0.0", \
    "@types/node": "20.0.0", \
    "@types/react": "18.2.0", \
    "@types/react-dom": "18.2.0", \
    "axios": "1.6.0", \
    "date-fns": "2.30.0", \
    "lucide-react": "0.290.0", \
    "recharts": "3.2.1", \
    "tailwindcss": "3.3.0", \
    "autoprefixer": "10.4.0", \
    "postcss": "8.4.0" \
  } \
}' > package.json

<<<<<<< Updated upstream
# 安装生产依赖
RUN npm ci --only=production && npm cache clean --force
=======
RUN npm install --only=production && npm cache clean --force
>>>>>>> Stashed changes

COPY . .
RUN npm run build

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs && \
    chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/stocks || exit 1
CMD ["npm", "start"]