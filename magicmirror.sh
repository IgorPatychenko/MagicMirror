#!/usr/bin/env bash
set -u

MM_DIR="$HOME/Projects/MagicMirror"
PROCESS_PATTERN='[e]lectron js/electron.js'

case "${1:-}" in
  start)
    if pgrep -f "$PROCESS_PATTERN" >/dev/null; then
      echo "MagicMirror is already running."
      exit 0
    fi

    cd "$MM_DIR" || exit 1
    nohup env DISPLAY=:0 node --run start \
      > /dev/null 2>&1 < /dev/null &
    echo "MagicMirror start command sent."
    ;;

  stop)
    if ! pgrep -f "$PROCESS_PATTERN" >/dev/null; then
      echo "MagicMirror is not running."
      exit 0
    fi

    pkill -TERM -f "$PROCESS_PATTERN"

    # Wait up to 15 seconds for a graceful shutdown.
    for _ in {1..15}; do
      if ! pgrep -f "$PROCESS_PATTERN" >/dev/null; then
        echo "MagicMirror stopped."
        exit 0
      fi
      sleep 1
    done

    echo "MagicMirror is still shutting down. Check it with: pgrep -af 'electron js/electron.js'"
    exit 1
    ;;

  status)
    if pgrep -af "$PROCESS_PATTERN"; then
      :
    else
      echo "MagicMirror is not running."
    fi
    ;;

  *)
    echo "Usage: $0 {start|stop|status}"
    exit 2
    ;;
esac
