FROM alpine:3.21

RUN apk add --no-cache openssh-server tini iputils build-base \
 && addgroup -S instance \
 && adduser -S -D -h /home/instance -s /bin/ash -G instance instance \
 && passwd -u instance \
 && mkdir -p /run/sshd /home/instance/.ssh /usr/local/etc \
 && chown -R instance:instance /home/instance/.ssh \
 && chmod 700 /home/instance/.ssh \
 && printf '%s\n' \
    'Port 22' 'Protocol 2' 'PermitRootLogin no' 'PasswordAuthentication no' \
    'KbdInteractiveAuthentication no' 'ChallengeResponseAuthentication no' \
    'PubkeyAuthentication yes' 'AuthorizedKeysFile /run/authorized_keys /run/internal_network_authorized_keys' 'AllowUsers instance' \
    'X11Forwarding no' 'AllowTcpForwarding no' 'AllowAgentForwarding no' \
    'PermitTunnel no' 'GatewayPorts no' 'MaxAuthTries 3' 'LoginGraceTime 30' \
    'ClientAliveInterval 300' 'ClientAliveCountMax 2' 'UsePAM no' 'PrintMotd no' \
    > /usr/local/etc/sshd_config

COPY internal-ssh.c /tmp/internal-ssh.c
RUN cc -O2 -Wall -Wextra -o /usr/local/bin/ssh /tmp/internal-ssh.c \
 && chown root:root /usr/local/bin/ssh \
 && chmod 4755 /usr/local/bin/ssh \
 && rm /tmp/internal-ssh.c \
 && apk del build-base

COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
EXPOSE 22
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["/usr/sbin/sshd", "-D", "-e", "-f", "/usr/local/etc/sshd_config"]
