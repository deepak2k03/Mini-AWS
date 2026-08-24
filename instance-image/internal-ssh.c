#include <ctype.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static int valid_hostname(const char *hostname) {
  size_t length = strlen(hostname);
  if (length == 0 || length > 63 || hostname[0] == '-' || hostname[length - 1] == '-') return 0;
  for (size_t index = 0; index < length; index++) {
    if (!isalnum((unsigned char) hostname[index]) && hostname[index] != '-') return 0;
  }
  return 1;
}

int main(int argc, char **argv) {
  const char *prefix = "instance@";
  if (argc != 2 || strncmp(argv[1], prefix, strlen(prefix)) != 0 || !valid_hostname(argv[1] + strlen(prefix))) {
    fprintf(stderr, "Internal SSH usage: ssh instance@<instance-hostname>\n");
    return 64;
  }
  char *ssh_args[] = {
    "/usr/bin/ssh", "-i", "/run/secrets/internal_ssh_key", "-o", "IdentitiesOnly=yes",
    "-o", "StrictHostKeyChecking=accept-new", "-o", "UserKnownHostsFile=/run/internal_known_hosts",
    "-o", "ClearAllForwardings=yes", "-o", "PermitLocalCommand=no", "-o", "ForwardAgent=no",
    "-o", "EnableEscapeCommandline=no", argv[1], NULL
  };
  execv(ssh_args[0], ssh_args);
  perror("Unable to start internal SSH");
  return 126;
}
