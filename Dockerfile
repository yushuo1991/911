# 宝塔面板Docker部署配置
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 设置时区
RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 设置文件权限
USER nextjs

# 启动应用
CMD ["npm", "start"]