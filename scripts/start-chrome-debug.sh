#!/bin/bash
# Chrome 调试模式启动脚本
# 用于配合 chrome-devtools MCP 使用

CHROME_DEBUG_PORT=9222
USER_DATA_DIR="/tmp/chrome-debug-$$"

echo "🚀 启动 Chrome 调试模式..."
echo "调试端口: $CHROME_DEBUG_PORT"
echo "用户数据目录: $USER_DATA_DIR"

# 检查 Chrome 是否已在运行
if lsof -Pi :$CHROME_DEBUG_PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 $CHROME_DEBUG_PORT 已被占用"
    echo "请关闭现有的 Chrome 调试实例或使用其他端口"
    exit 1
fi

# 启动 Chrome
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=$CHROME_DEBUG_PORT \
  --user-data-dir="$USER_DATA_DIR" \
  --no-first-run \
  --no-default-browser-check \
  "http://localhost:3000" &

CHROME_PID=$!

echo "✓ Chrome 已启动 (PID: $CHROME_PID)"
echo "调试地址: http://localhost:$CHROME_DEBUG_PORT"
echo ""
echo "按 Ctrl+C 停止..."

# 等待并清理
trap "echo ''; echo '🛑 停止 Chrome...'; kill $CHROME_PID 2>/dev/null; rm -rf '$USER_DATA_DIR'; exit 0" INT TERM

wait $CHROME_PID
