# F · 出海工具库

面向跨境电商与外贸的软件目录，包含公开产品展示及独立管理员后台。

## 使用网站

域名备案期间，网站只监听服务器本机地址。双击 `ops/打开出海工具库.command` 建立 SSH 安全连接，再打开：

- 前台：<http://127.0.0.1:3180>
- 管理后台：<http://127.0.0.1:3180/admin>

使用完可双击 `ops/关闭安全连接.command`。关闭连接不会停止服务器上的网站。

管理员账号是 `admin`。初始随机密码单独交付，不在源码里；可在后台的账号设置修改。修改密码会使已有登录会话失效。

## 产品管理

1. 登录后台，点击“新增产品”，填写名称、厂商、简介、官网、分类和资料来源等信息。
2. 保存为草稿后，通过预览检查内容。草稿不会出现在前台。
3. 点击上架后，产品进入前台目录和搜索结果。
4. 下架会保留资料，同时隐藏公开列表、搜索结果和原详情链接。需要时可重新上架。
5. Logo 可上传 PNG、JPEG、WebP，最大 2 MB。图片会重新编码后保存。

“有中文资料”表示本次核验找到中文资料，不保证所有功能均有中文界面。软件价格和功能以产品官网为准。首批条目是官网资料整理，不是实测评分。

## 本地开发

需要 Node.js 24。运行 `npm ci` 安装锁定依赖。通过本地环境设置 `ADMIN_INITIAL_PASSWORD`（至少 12 位），执行 `npm run db:init`，然后 `npm run dev`。

`DATA_DIR` 默认 `.runtime`；产品资料、管理员、会话和日志存放在其中的 `hub.sqlite`，上传图片存放在 `uploads`。首次种子导入会记录完成标记，后续启动或部署不会覆盖运营数据。

验证命令：`npm run typecheck`、`npm test`、`npm run build`。`scripts/verify-http.mjs` 会验证真实 HTTP 权限和产品生命周期，并生成一条明确标记的测试产品；仅用于验收，并按报告中的 ID 清理。

## 服务器部署

服务器通过 SSH 别名 `aliyun` 连接；应用目录 `/opt/f-software-hub`。使用独立 Docker Compose 项目，端口仅为 `127.0.0.1:3180`。

构建 Linux amd64 镜像：

```sh
docker build --platform linux/amd64 -t f-software-hub:<版本> .
```

上传镜像后，在部署目录的 `release.env` 中设置 `HUB_IMAGE=f-software-hub:<版本>`，使用：

```sh
docker compose --env-file release.env up -d
docker compose --env-file release.env ps
```

`data/` 和 `backups/` 为持久化目录；初始化凭据文件在 `secrets/`，均不进 Git。容器运行账号为 UID 1000，持久化目录应由该账号写入。部署前先备份；保留上一版本镜像和对应配置。

## 备份与回退

备份包含产品数据库、管理员资料、操作日志和上传图片。每次先生成临时文件，检查数据库完整性和压缩包后才成为正式备份；失败的半成品不参与轮转。保留最近 7 份成功备份。首次验收备份另存本机；服务器本地备份不等同于持续的异地容灾。

本次版本约定：首发镜像为 `f-software-hub:20261027-v1`（与 `20261027-rc2` 内容相同），保留上一版本 `f-software-hub:20261027-rc1`。每次升级前记录当前 `release.env`、备份文件名和数据库迁移版本，以便找到相匹配的备份。

### 安装备份定时器

首次安装或更新运维文件时，在本机项目目录执行：

```sh
scp ops/backup.sh ops/f-software-hub-backup.service ops/f-software-hub-backup.timer aliyun:/opt/f-software-hub/
ssh aliyun
```

以下命令在服务器终端执行。定时器按服务器时区每天 03:40 开始，在 15 分钟内随机触发；服务器错过计划时间后会补执行。

```sh
chmod 755 /opt/f-software-hub/backup.sh
install -m 644 /opt/f-software-hub/f-software-hub-backup.service /etc/systemd/system/
install -m 644 /opt/f-software-hub/f-software-hub-backup.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now f-software-hub-backup.timer
systemctl list-timers --all f-software-hub-backup.timer
```

手动备份、查看最近运行结果和失败原因：

```sh
/opt/f-software-hub/backup.sh
systemctl status f-software-hub-backup.timer --no-pager
journalctl -u f-software-hub-backup.service -n 50 --no-pager
ls -lh /opt/f-software-hub/backups/
```

成功时脚本输出备份文件路径和保留数量。一次性备份服务完成后显示 `inactive` 是正常现象；失败详情以日志中的错误为准。备份需要应用容器处于运行状态。

### 隔离恢复演练

**恢复会将产品、图片和账号资料退回备份时间，备份之后的修改不会出现在恢复后的数据库里。** 交付验收采用隔离目录恢复，不覆盖正在运行的数据。日常检查也先执行下面的演练；仅解压和检查不会改变网站。

先用 `ssh aliyun` 进入服务器的 Bash 终端，再执行以下整段。只选择本项目生成的备份；不要使用不明来源的压缩包。

```bash
(
  set -eu
  cd /opt/f-software-hub
  read -r -p '请输入备份文件的完整路径：' TASK_BACKUP
  case "$TASK_BACKUP" in
    /opt/f-software-hub/backups/f-hub-backup-*.tar.gz) ;;
    *) printf '%s\n' '请选择本项目 backups 目录内的正式备份。'; exit 1 ;;
  esac
  test -f "$TASK_BACKUP"
  tar -tzf "$TASK_BACKUP" >/dev/null
  TASK_RESTORE=$(mktemp -d /opt/f-software-hub/restore-check.XXXXXX)
  tar -xzf "$TASK_BACKUP" -C "$TASK_RESTORE"
  test -f "$TASK_RESTORE/hub.sqlite"
  test -d "$TASK_RESTORE/uploads"
  docker run --rm --network none --user 0:0 --entrypoint node \
    --mount "type=bind,src=$TASK_RESTORE,dst=/restore" \
    f-software-hub:20261027-v1 -e '
      const Database = require("better-sqlite3");
      const db = new Database("/restore/hub.sqlite", {readonly:true,fileMustExist:true});
      if (db.pragma("integrity_check", {simple:true}) !== "ok") throw new Error("数据库校验失败");
      console.log("完整性检查通过，产品数量：", db.prepare("SELECT count(*) AS n FROM products").get().n);
      console.log("迁移版本：", db.prepare("SELECT version FROM schema_migrations ORDER BY version").all());
      db.close();
    '
  printf '演练目录：%s\n运行中的 data 目录未被修改。\n' "$TASK_RESTORE"
)
```

### 正式恢复数据

只有确定要退回备份时间时才执行。先完成上面的隔离演练，核对所选备份和镜像版本。以下示例对应本次首发版本；未来若新增了不兼容数据库迁移，须改用与备份匹配的镜像。

下面会停止应用和自动备份，将**整个旧 `data` 目录**原样保留，再放入已验证的恢复目录。不要只覆盖 `hub.sqlite`：旧的 `hub.sqlite-wal` 或 `hub.sqlite-shm` 可能影响恢复后的数据库。

在同一个服务器 Bash 终端执行：

```bash
(
  set -eu
  cd /opt/f-software-hub
  read -r -p '请输入上一步检查通过的演练目录：' TASK_RESTORE
  case "$TASK_RESTORE" in
    /opt/f-software-hub/restore-check.*) ;;
    *) printf '%s\n' '只能使用本项目的隔离恢复目录。'; exit 1 ;;
  esac
  test -f "$TASK_RESTORE/hub.sqlite"
  test -d "$TASK_RESTORE/uploads"
  docker image inspect f-software-hub:20261027-v1 >/dev/null
  read -r -p '输入 RESTORE 确认将网站恢复到该备份时间：' TASK_CONFIRM
  test "$TASK_CONFIRM" = RESTORE
  TASK_OLD=$(mktemp -d /opt/f-software-hub/data-before-restore.XXXXXX)
  cp -p release.env "$TASK_OLD/release.env"
  printf '旧数据和配置将保留在：%s\n' "$TASK_OLD"
  systemctl stop f-software-hub-backup.timer
  docker compose --env-file release.env stop app
  mv data "$TASK_OLD/data"
  mv "$TASK_RESTORE" data
  chown -R 1000:1000 data
  chmod 700 data
  chmod 600 data/hub.sqlite
  sed -i 's/^HUB_IMAGE=.*/HUB_IMAGE=f-software-hub:20261027-v1/' release.env
  docker compose --env-file release.env up -d --wait --wait-timeout 90
  curl --fail --silent --show-error http://127.0.0.1:3180/api/health
  systemctl start f-software-hub-backup.timer
  printf '\n恢复完成。请检查产品、图片和后台登录。旧数据仍在：%s\n' "$TASK_OLD"
)
```

如果中途报错，停止后续操作并保留显示出的旧数据路径，不要删除原目录。自动备份仅在健康检查成功后重新开启。恢复之后建议重置管理员密码，以撤销备份内的旧登录会话。

### 仅回退程序版本

当前 `v1` 与 `rc1` 使用相同数据库结构，可只切换镜像，保留现有产品资料。未来有不兼容迁移时，应先按上面的流程恢复匹配的数据，不能直接启动旧程序读取不兼容结构。

以下命令在服务器 Bash 终端执行；开始前先完成一次成功备份：

```bash
(
  set -eu
  cd /opt/f-software-hub
  ./backup.sh
  docker image inspect f-software-hub:20261027-rc1 >/dev/null
  TASK_RELEASE_COPY=$(mktemp /opt/f-software-hub/release-before-rollback.XXXXXX)
  cp -p release.env "$TASK_RELEASE_COPY"
  sed -i 's/^HUB_IMAGE=.*/HUB_IMAGE=f-software-hub:20261027-rc1/' release.env
  docker compose --env-file release.env up -d --wait --wait-timeout 90
  curl --fail --silent --show-error http://127.0.0.1:3180/api/health
  printf '\n已回退。原版本配置保留在：%s\n' "$TASK_RELEASE_COPY"
)
```

### 重置管理员密码

忘记密码时，在服务器 Bash 终端执行以下整段。输入过程不显示密码，密码通过标准输入交给容器，不会写入命令参数或脚本输出；至少 12 位。成功后所有旧会话立即失效。

```bash
(
  set -eu
  cd /opt/f-software-hub
  read -r -s -p '请输入新的管理员密码：' TASK_NEW_PASSWORD
  printf '\n'
  printf '%s' "$TASK_NEW_PASSWORD" | \
    docker compose --env-file release.env exec -T app node --import tsx scripts/reset-admin.ts
  unset TASK_NEW_PASSWORD
)
```

## 正式开放前

域名备案和接入条件满足后，配置域名、HTTPS、反向代理和准确的 `APP_ORIGIN`；管理员会话会随 HTTPS 自动启用 Secure Cookie。届时检查公网访问、隐私说明、备份目标与访问监控。当前代码没有用户注册、支付、厂商入驻或自动采集。

此前 `.openai/hosting.json` 仅记录一个未发布的 Sites 项目，不参与本次阿里云部署。
