# Docker 镜像部署指南

本文档提供了如何直接使用 Docker 镜像部署此 Next.js 应用的说明，无需使用 Docker Compose。

## 前提条件

- 安装 [Docker](https://docs.docker.com/get-docker/)

## 环境变量配置

在运行应用之前，请确保已正确配置环境变量。您可以通过以下两种方式之一进行配置：

1. 使用 `.env` 文件（推荐）
2. 直接在 `docker run` 命令中通过 `-e` 参数设置环境变量

必要的环境变量包括：

```
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4/
OPENAI_MODEL=glm-4-flash
OPENAI_TEMPERATURE=0.6
OPENAI_MAX_TOKENS=4000
```

## 构建和运行

### 构建 Docker 镜像

在项目根目录下运行：

```bash
docker build -t aidocediter:latest .
```

### 运行 Docker 容器

#### 方法一：使用 .env 文件（推荐）

确保您已经在项目根目录创建了 `.env` 文件，然后运行：

```bash
docker run -p 3000:3000 --env-file .env -d --name aidocediter-app aidocediter:latest
```

#### 方法二：直接传递环境变量

```bash
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=your_api_key_here \
  -e OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4/ \
  -e OPENAI_MODEL=glm-4-flash \
  -e OPENAI_TEMPERATURE=0.6 \
  -e OPENAI_MAX_TOKENS=4000 \
  -d --name aidocediter-app aidocediter:latest
```

### 访问应用

打开浏览器并访问 `http://localhost:3000`

### 管理容器

#### 查看容器状态

```bash
docker ps
```

#### 查看容器日志

```bash
docker logs aidocediter-app
```

或者实时查看日志：

```bash
docker logs -f aidocediter-app
```

#### 停止容器

```bash
docker stop aidocediter-app
```

#### 启动已停止的容器

```bash
docker start aidocediter-app
```

#### 删除容器

```bash
docker rm aidocediter-app
```

注意：删除前需要先停止容器。

#### 删除镜像

```bash
docker rmi aidocediter:latest
```

## 注意事项

- 默认情况下，应用将在端口 3000 上运行。如需更改，请修改 `docker run` 命令中的端口映射参数 `-p`。
- 生产环境中，建议使用 HTTPS 并配置适当的反向代理（如 Nginx）。
- 确保您的 OpenAI API 密钥有足够的配额，以避免应用在使用过程中出现问题。
- 如果需要持久化数据，可以使用 Docker 卷（volumes）。

## 高级配置

### 设置容器自动重启

```bash
docker run -p 3000:3000 --env-file .env -d --restart always --name aidocediter-app aidocediter:latest
```

重启策略选项：
- `no`：默认策略，容器退出时不重启
- `on-failure`：容器非正常退出时重启（退出状态非0）
- `always`：容器退出时总是重启
- `unless-stopped`：容器退出时总是重启，但不考虑在Docker守护进程启动时就已经停止了的容器

### 限制容器资源

```bash
docker run -p 3000:3000 --env-file .env -d \
  --memory="1g" \
  --cpus="1.0" \
  --name aidocediter-app aidocediter:latest
```

这将限制容器使用最多1GB内存和1个CPU核心。 