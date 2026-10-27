#!/bin/zsh
set -eu
TASK_PORT=3180
TASK_CONTROL="$HOME/.ssh/f-software-hub-tunnel.sock"
if ! ssh -S "$TASK_CONTROL" -O check aliyun >/dev/null 2>&1; then
  if lsof -nP -iTCP:$TASK_PORT -sTCP:LISTEN >/dev/null 2>&1; then
    echo "本机 3180 端口已被其他程序占用，请先关闭该程序后重试。"
    read -k 1 "?按任意键关闭窗口。"
    exit 1
  fi
  ssh -fNT -M -S "$TASK_CONTROL" -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -L 127.0.0.1:$TASK_PORT:127.0.0.1:3180 aliyun
fi
open "http://127.0.0.1:$TASK_PORT"
echo "网站已打开。管理后台：http://127.0.0.1:$TASK_PORT/admin"
