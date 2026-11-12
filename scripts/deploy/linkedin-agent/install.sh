#!/usr/bin/env bash
set -euo pipefail
umask 022
if [[ $EUID -ne 0 ]]; then echo 'Installer avec sudo/root.' >&2; exit 1; fi
bm_node=''
while [[ $# -gt 0 ]]; do
  case "$1" in
    --node) [[ $# -ge 2 ]] || exit 2; bm_node=$2; shift 2 ;;
    *) echo 'Utilisation : bash deploy/install.sh --node /chemin/absolu/node' >&2; exit 2 ;;
  esac
done
if [[ ! $bm_node =~ ^/[A-Za-z0-9_./+-]+$ || ! -x $bm_node ]]; then echo 'Un binaire Node absolu et exécutable est requis.' >&2; exit 1; fi
bm_node=$(readlink -f -- "$bm_node")
bm_node_dir=$(dirname -- "$bm_node")
export PATH="$bm_node_dir:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
unset OPENAI_API_KEY CODEX_API_KEY CODEX_ACCESS_TOKEN ADMIN_PASSWORD LINKEDIN_CLIENT_SECRET DATABASE_URL BLOB_READ_WRITE_TOKEN
[[ $(uname -s) == Linux ]] || { echo 'Linux avec systemd requis.' >&2; exit 1; }
source /etc/os-release
[[ $ID == ubuntu || $ID == debian ]] || { echo 'Installation prévue pour Ubuntu/Debian.' >&2; exit 1; }
[[ -d /run/systemd/system ]] || { echo 'systemd doit gérer ce serveur.' >&2; exit 1; }
"$bm_node" -e 'const [major,minor]=process.versions.node.split(".").map(Number);if(major<22||(major===22&&minor<15))process.exit(1)' || { echo 'Node22.15+ requis ; ne pas utiliser Node18 du système.' >&2; exit 1; }
command -v npm >/dev/null
bm_package=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)
bm_id=$("$bm_node" "$bm_package/deploy/verify-package.mjs" "$bm_package")
[[ $bm_id =~ ^[a-f0-9]{16}$ ]] || exit 1
bm_base=/opt/bm-linkedin
bm_release="$bm_base/releases/$bm_id"
if [[ -e $bm_base/current && ! -L $bm_base/current ]]; then echo 'current existe et n’est pas un lien symbolique. Arrêt.' >&2; exit 1; fi
if systemctl cat bm-linkedin.timer >/dev/null 2>&1; then systemctl stop bm-linkedin.timer; fi
if systemctl is-active --quiet bm-linkedin.service; then echo 'Un cycle est encore actif. Timer arrêté ; attendre sa fin puis relancer cette installation. Aucun processus interrompu.' >&2; exit 1; fi
if ! getent group bm-linkedin >/dev/null; then groupadd --system bm-linkedin; fi
if ! id bm-linkedin >/dev/null 2>&1; then useradd --system --gid bm-linkedin --home-dir /var/lib/bm-linkedin/home --no-create-home --shell /usr/sbin/nologin bm-linkedin; fi
bm_home=$(getent passwd bm-linkedin | cut -d: -f6)
[[ $bm_home == /var/lib/bm-linkedin/home ]] || { echo 'L’utilisateur bm-linkedin possède un HOME inattendu. Arrêt.' >&2; exit 1; }
[[ $(id -u bm-linkedin) -ne 0 && $(id -gn bm-linkedin) == bm-linkedin ]] || { echo 'Le compte doit être non root et utiliser le groupe bm-linkedin.' >&2; exit 1; }
install -d -o root -g root -m 0755 "$bm_base" "$bm_base/releases" "$bm_base/browsers" "$bm_release"
install -d -o bm-linkedin -g bm-linkedin -m 0700 /var/lib/bm-linkedin /var/lib/bm-linkedin/home /var/lib/bm-linkedin/home/.codex /var/lib/bm-linkedin/state
# Copy only the verified code package. HOME/state and any login session remain untouched.
cp -a -- "$bm_package/." "$bm_release/"
chown -R root:root "$bm_release"
chmod -R u=rwX,go=rX "$bm_release"
(cd -- "$bm_release" && npm ci --ignore-scripts --omit=dev --no-audit --no-fund)
(cd -- "$bm_release/runtime/codex" && npm ci --ignore-scripts --omit=dev --no-audit --no-fund)
PLAYWRIGHT_BROWSERS_PATH="$bm_base/browsers" "$bm_node" "$bm_release/node_modules/playwright/cli.js" install chromium --no-shell
"$bm_release/runtime/codex/node_modules/.bin/codex" --version
"$bm_node" --input-type=module -e "import('$bm_release/node_modules/esbuild/lib/main.js').then(x=>x.transform('const ok = true;'))"
# Node18 can coexist on the host: both the service and CLI helper get the explicit Node22+ path.
sed -e "s|@NODE_BINARY@|$bm_node|g" -e "s|@NODE_DIRECTORY@|$bm_node_dir|g" "$bm_package/deploy/bm-linkedin.service" > /etc/systemd/system/bm-linkedin.service
install -o root -g root -m 0644 "$bm_package/deploy/bm-linkedin.timer" /etc/systemd/system/bm-linkedin.timer
sed -e "s|@NODE_BINARY@|$bm_node|g" -e "s|@NODE_DIRECTORY@|$bm_node_dir|g" "$bm_package/deploy/as-user.sh" > /usr/local/sbin/bm-linkedin-as-user
chmod 0644 /etc/systemd/system/bm-linkedin.service
chmod 0755 /usr/local/sbin/bm-linkedin-as-user
bm_link="$bm_base/.current-install-$$"
ln -s -- "$bm_release" "$bm_link"
mv -Tf -- "$bm_link" "$bm_base/current"
systemd-analyze verify /etc/systemd/system/bm-linkedin.service /etc/systemd/system/bm-linkedin.timer
systemctl daemon-reload
systemctl disable --now bm-linkedin.timer
echo "Release installée : $bm_id. Timer désactivé. Authentifier Codex, importer la liaison, vérifier doctor/rendu, puis activer le timer."
