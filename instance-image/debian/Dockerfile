FROM debian:13

ENV DEBIAN_FRONTEND=noninteractive

 RUN apt-get update && apt-get install -y --no-install-recommends openssh-server tini iputils-ping build-essential vim nano \
  && groupadd -r instance \
  && useradd -r -m -d /home/instance -s /bin/bash -g instance instance \
  && echo 'instance:MiniAwsInstance2026' | chpasswd \
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
    > /usr/local/etc/sshd_config \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY internal-ssh.c /tmp/internal-ssh.c
RUN cc -O2 -Wall -Wextra -o /usr/local/bin/ssh /tmp/internal-ssh.c \
 && chown root:root /usr/local/bin/ssh \
 && chmod 4755 /usr/local/bin/ssh \
 && rm /tmp/internal-ssh.c \
 && apt-get remove -y build-essential && apt-get autoremove -y

COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
EXPOSE 22
ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["/usr/sbin/sshd", "-D", "-e", "-f", "/usr/local/etc/sshd_config"]
