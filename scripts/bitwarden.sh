#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"
ITEM_NAME="mon-store-exo"
KEYS=(
  MYSQL_ROOT_PASSWORD
  MYSQL_DATABASE
  MYSQL_USER
  MYSQL_PASSWORD
  JWT_SECRET
)

require_session() {
  if [[ -z "${BW_SESSION:-}" ]]; then
    echo "Déverrouille Bitwarden, puis relance la commande :" >&2
    echo '  export BW_SESSION="$(bw unlock --raw)"' >&2
    exit 1
  fi

  local status
  status="$(bw status --session "$BW_SESSION" | jq -r '.status')"
  if [[ "$status" != "unlocked" ]]; then
    echo "Le coffre Bitwarden est verrouillé." >&2
    echo '  export BW_SESSION="$(bw unlock --raw)"' >&2
    exit 1
  fi
}

read_env() {
  local key value
  declare -gA ENV_VALUES=()

  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Fichier .env introuvable." >&2
    exit 1
  fi

  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" == \#* ]] && continue
    key="${line%%=*}"
    value="${line#*=}"
    ENV_VALUES["$key"]="$value"
  done < "$ENV_FILE"

  for key in "${KEYS[@]}"; do
    if [[ -z "${ENV_VALUES[$key]:-}" ]]; then
      echo "Valeur manquante dans .env : $key" >&2
      exit 1
    fi
  done
}

fields_json() {
  local key type=1
  local payload='[]'

  for key in "${KEYS[@]}"; do
    payload="$(jq -c --arg name "$key" --arg value "${ENV_VALUES[$key]}" \
      '. + [{name: $name, value: $value, type: 1}]' <<<"$payload")"
  done

  printf '%s' "$payload"
}

cmd_push() {
  require_session
  read_env

  local fields existing id payload
  fields="$(fields_json)"

  if existing="$(bw get item "$ITEM_NAME" --session "$BW_SESSION" 2>/dev/null)"; then
    id="$(jq -r '.id' <<<"$existing")"
    payload="$(jq -c --argjson fields "$fields" '.fields = $fields' <<<"$existing")"
    printf '%s' "$payload" | bw encode | bw edit item "$id" --session "$BW_SESSION" >/dev/null
    echo "Secrets mis à jour dans Bitwarden ($ITEM_NAME)."
  else
    payload="$(bw get template item --session "$BW_SESSION" | jq -c \
      --arg name "$ITEM_NAME" \
      --argjson fields "$fields" \
      '.type = 2 | .name = $name | .notes = "Secrets Docker de mon-store-exo" | .secureNote = {type: 0} | .fields = $fields')"
    printf '%s' "$payload" | bw encode | bw create item --session "$BW_SESSION" >/dev/null
    echo "Secrets enregistrés dans Bitwarden ($ITEM_NAME)."
  fi
}

load_from_vault() {
  require_session

  local item key value
  if ! item="$(bw get item "$ITEM_NAME" --session "$BW_SESSION" 2>/dev/null)"; then
    echo "Aucun élément « $ITEM_NAME » dans le coffre." >&2
    echo "Enregistre d'abord les secrets actuels :" >&2
    echo "  ./scripts/bitwarden.sh push" >&2
    exit 1
  fi

  for key in "${KEYS[@]}"; do
    value="$(jq -r --arg name "$key" '.fields[] | select(.name == $name) | .value' <<<"$item")"
    if [[ -z "$value" || "$value" == "null" ]]; then
      echo "Champ manquant dans Bitwarden : $key" >&2
      exit 1
    fi
    export "$key=$value"
  done
}

cmd_compose() {
  load_from_vault
  cd "$ROOT"
  docker compose "$@"
}

usage() {
  echo "Usage :"
  echo "  ./scripts/bitwarden.sh push          Envoie le .env local vers Bitwarden"
  echo "  ./scripts/bitwarden.sh compose ...   Lance docker compose avec les secrets du coffre"
}

case "${1:-}" in
  push)
    cmd_push
    ;;
  compose)
    shift
    cmd_compose "$@"
    ;;
  *)
    usage
    exit 1
    ;;
esac
