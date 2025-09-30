# 股票追踪系统 Docker配置 - 优化版
FROM node:18-alpine AS base

# 安装依赖包和时区数据
RUN apk add --no-cache libc6-compat curl tzdata
ENV TZ=Asia/Shanghai

WORKDIR /app

# 复制package文件
COPY package.json package-lock.json* ./

# ===================================
# 依赖安装阶段
# ===================================
FROM base AS deps
RUN npm ci

# ===================================
# 构建阶段
# ===================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建Next.js应用
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# ===================================
# 生产运行阶段
# ===================================
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED 1

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 创建数据目录
RUN mkdir -p /app/data /app/logs && \
    chown -R nextjs:nodejs /app

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "server.js"]