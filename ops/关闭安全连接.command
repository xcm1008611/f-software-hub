#!/bin/zsh
ssh -S "$HOME/.ssh/f-software-hub-tunnel.sock" -O exit aliyun 2>/dev/null || true
echo "出海工具库的安全连接已关闭。服务器上的网站继续运行。"
