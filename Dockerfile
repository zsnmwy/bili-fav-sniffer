FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN yarn build

# If using npm comment out above and use below instead
# RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

RUN apk update && \
    apk upgrade && \
    apk add --no-cache curl bash jq ffmpeg tzdata py3-configobj py3-pip py3-setuptools python3 python3-dev gcc g++ make && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Shanghai/Asia" > /etc/timezone && \
    rm -rf /var/cache/apk/* && \
    /bin/bash && \
    python3 -m pip install you-get


ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

#RUN addgroup --system --gid 1001 nodejs
#RUN adduser --system --uid 1001 nextjs

# 设置时区变量
ENV TIME_ZONE Asia/Shanghai
# 设置 语言支持
ENV LANG=zh_CN.UTF-8
ENV LANGUAGE=zh_CN:zh

COPY /libs/DanmakuFactory-1.63.tar.gz ./

RUN tar -zxvf DanmakuFactory-1.63.tar.gz && \
    cd DanmakuFactory-1.63 && \
    mkdir temp && \
    make && \
    mkdir /usr/you-get-download && \
    chown -R node:node /usr/you-get-download && \
    chown -R node:node /app

COPY --from=builder --chown=node:node /app/public ./public
COPY --chown=node:node /script/sniffer.sh /app/

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]

