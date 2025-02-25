FROM node:20-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 安装依赖阶段
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 构建阶段
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建应用
ENV NEXT_TELEMETRY_DISABLED=1
ENV OPENAI_API_KEY=dummy-key-for-build
ENV OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4/
ENV OPENAI_MODEL=glm-4-flash
ENV OPENAI_TEMPERATURE=0.6
ENV OPENAI_MAX_TOKENS=4000
RUN pnpm build

# 生产阶段
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# 复制必要文件
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动应用
CMD ["node", "server.js"] 