#!/bin/bash
# tools/kijk/kijk.sh <worktree> <poort> <route[,route...]>...
# Kopieert de worktree (ook ongecommit) naar /tmp/kijk-<poort>, bouwt hem als preview (met de demo-voortgang),
# serveert dist op <poort> en maakt screenshots in /tmp/kijk-<poort>/shots. Stopt de server daarna op zijn eigen PID.
# Opties via de omgeving: zie kijk.mjs. KIJK_LATEN=1 laat de server draaien (stoppen: kill $(cat /tmp/kijk-<poort>/server.pid)).
# Voorbeeld: tools/kijk/kijk.sh . 5177 /vandaag,/akkoorden,/liedjes/wonderwall
set -e
HIER=$(dirname "$(realpath "$0")")
WT=$(realpath "$1"); POORT=$2; shift 2
K=/tmp/kijk-$POORT
mkdir -p $K/src
rsync -a --delete --exclude node_modules --exclude dist --exclude .git "$WT/" $K/src/
(cd $K/src && bun install --frozen-lockfile >/dev/null && VITE_PREVIEW=kijk bun run build >$K/build.log 2>&1) || { echo "Bouwen mislukt, zie $K/build.log"; exit 1; }
[ -f $K/server.pid ] && kill "$(cat $K/server.pid)" 2>/dev/null || true
nohup python3 -m http.server $POORT --bind 0.0.0.0 -d $K/src/dist >$K/server.log 2>&1 &
echo $! > $K/server.pid
for i in $(seq 1 40); do curl -s --noproxy '*' -o /dev/null http://127.0.0.1:$POORT/ && break; sleep 0.25; done
[ -d "$HIER/node_modules" ] || (cd "$HIER" && bun install --frozen-lockfile >/dev/null)
rm -rf $K/shots
for spec in "$@"; do
  IFS=',' read -ra R <<< "$spec"
  KIJK_BASE=http://127.0.0.1:$POORT bun "$HIER/kijk.mjs" $K/shots "${R[@]}"
done
if [ -z "$KIJK_LATEN" ]; then kill "$(cat $K/server.pid)" 2>/dev/null || true; rm -f $K/server.pid; fi
echo "Screenshots in $K/shots"
