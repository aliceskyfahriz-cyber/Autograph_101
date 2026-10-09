#!/usr/bin/env bash
# Catat event kerja agent ke ledger data/tasks.jsonl
# Pakai: ./log-task.sh <task_id> <agent_id> <started|progress|done|failed> "<judul>" "<detail>"
# Contoh:
#   ./log-task.sh riset-harga-kompetitor research-agent-01 started "Riset harga kompetitor" "mulai kumpulkan sumber"
#   ./log-task.sh riset-harga-kompetitor research-agent-01 done    "Riset harga kompetitor" "laporan selesai"
set -eu
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TASK_ID="${1:?task_id wajib}"
AGENT="${2:?agent wajib (id roster: muse|aris|udin|vision-agent-03|research-agent-01|coding-agent-02)}"
STATUS="${3:?status wajib}"
TITLE="${4:-}"
DETAIL="${5:-}"
UUID="$(cat /proc/sys/kernel/random/uuid)"
TS="$(TZ=Asia/Jakarta date +%Y-%m-%dT%H:%M:%S+07:00)"
python3 - "$DIR/data/tasks.jsonl" "$TS" "$TASK_ID" "$AGENT" "$UUID" "$TITLE" "$STATUS" "$DETAIL" <<'PYEOF'
import json, sys
path, ts, task_id, agent, uuid, title, status, detail = sys.argv[1:9]
ev = {"ts": ts, "task_id": task_id, "agent": agent, "subagent": uuid,
      "title": title, "status": status, "detail": detail}
with open(path, "a") as f:
    f.write(json.dumps(ev, ensure_ascii=False) + "\n")
print("tercatat:", json.dumps(ev, ensure_ascii=False))
PYEOF
