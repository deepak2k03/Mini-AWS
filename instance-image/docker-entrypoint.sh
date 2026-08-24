#!/bin/sh
set -eu
key_file="${SSH_AUTHORIZED_KEYS_FILE:-/run/secrets/authorized_keys}"
test -r "$key_file" || { echo 'No authorized keys file mounted' >&2; exit 64; }
test -r /run/secrets/internal_network_authorized_key || { echo 'No internal network key mounted' >&2; exit 64; }
test -r /run/secrets/internal_ssh_key || { echo 'No internal SSH credential mounted' >&2; exit 64; }
install -o instance -g instance -m 600 "$key_file" /run/authorized_keys
install -o instance -g instance -m 600 /run/secrets/internal_network_authorized_key /run/internal_network_authorized_keys
ssh-keygen -A
exec "$@"
