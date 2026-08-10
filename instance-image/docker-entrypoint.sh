#!/bin/sh
set -eu
key_file="${SSH_AUTHORIZED_KEYS_FILE:-/run/secrets/authorized_keys}"
test -r "$key_file" || { echo 'No authorized keys file mounted' >&2; exit 64; }
install -o instance -g instance -m 600 "$key_file" /run/authorized_keys
ssh-keygen -A
exec "$@"
