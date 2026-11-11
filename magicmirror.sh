#!/usr/bin/env bash
set -u

MM_DIR="$HOME/Projects/MagicMirror"
PROCESS_PATTERN='[e]lectron js/electron.js'

start_mirror () {
  if pgrep -f "$PROCESS_PATTERN" >/dev/null; then
    echo "MagicMirror is already running."
    return 0
  fi

  cd "$MM_DIR" || return 1
  nohup env DISPLAY=:0 node --run start \
    > /dev/null 2>&1 < /dev/null &
  echo "MagicMirror start command sent."
}

stop_mirror () {
  if ! pgrep -f "$PROCESS_PATTERN" >/dev/null; then
    echo "MagicMirror is not running."
    return 0
  fi

  pkill -TERM -f "$PROCESS_PATTERN"

  # Wait up to 15 seconds for a graceful shutdown.
  for _ in {1..15}; do
    if ! pgrep -f "$PROCESS_PATTERN" >/dev/null; then
      echo "MagicMirror stopped."
      return 0
    fi
    sleep 1
  done

  echo "MagicMirror is still shutting down. Check it with: pgrep -af 'electron js/electron.js'"
  return 1
}

case "${1:-}" in
  start)
    start_mirror
    ;;

  stop)
    stop_mirror
    ;;

  restart)
    if stop_mirror; then
      sleep 1
      start_mirror
    else
      exit 1
    fi
    ;;

  status)
    if pgrep -af "$PROCESS_PATTERN"; then
      :
    else
      echo "MagicMirror is not running."
    fi
    ;;

  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 2
    ;;
esac
