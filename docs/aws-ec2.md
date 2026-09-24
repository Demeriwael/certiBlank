# EC2 deployment with Docker and Nginx

Browser → Nginx on Ubuntu (HTTPS) → 127.0.0.1:3000 → Next.js container → Supabase.

Target: Ubuntu 24.04 x86_64, one low-traffic EC2 instance, existing Supabase DB.
Docker packages Node.js 24 and the app. Compose manages restart policy, resources,
logs, and networking. Nginx and Certbot stay on the host. Do not install Node.js
on the host or use the earlier application-specific systemd unit.

GitHub Actions builds and tests the image. Deployment stays **manual**. CI receives
no AWS credentials, SSH keys, or production secrets, and performs no database
migration or seed. Netlify stays available until you choose to switch.

## Before starting

- Security group: SSH 22 from your IP, public 80/443, **no public 3000**.
- Associate one Elastic IP. Point your purchased domain's A record to it before
  HTTPS setup. Initially use DNS-only mode if using Cloudflare DNS.
- Confirm a recoverable Supabase backup. This change needs no schema migration.
- Set billing and uptime alerts. Alerts do not cap spending. One EC2 instance has
  maintenance/restart downtime; this is not a high-availability architecture.
- Keep Netlify until HTTPS, authentication, and exam flows pass on the new site.

## Build and download the image

Review/push the AWS branch using the usual Git/PR workflow. CI runs the existing
lint, typecheck, tests, audit, bank validation, and build. A second job builds the
Docker image and tests the actual Compose deployment: homepage/CSS, API validation,
Prisma engine loading, non-root execution, and writable cache/read-only app files.

For a release, open **Actions → CI → Run workflow**, select the reviewed branch,
and enable **Downloadable Docker image for manual EC2 deployment**. If the input
is absent, review/merge the workflow onto the default branch first. A merge does
not deploy anything.

Download and unzip the artifact `certiblank-ec2-<commit>`. It contains:

- `certiblank-image.tar.gz`: Linux/amd64 Docker image.
- `certiblank-image.tar.gz.sha256`: transfer-integrity checksum.
- `release.env`: exact image tag (`certiblank:<full-commit-sha>`).
- `deploy/ec2/`: Compose, Nginx, and runtime environment templates.

The Dockerfile uses dummy build credentials. Its allowlisted build context excludes
local env files, keys, Git history, question banks, and old build caches. Real
credentials are supplied only at runtime. The final image copies the standalone
app, static assets, and Linux Prisma engine, not the full development environment.

The base image `node:24-bookworm-slim` tracks Node 24/Debian patches. Rebuild
regularly for updates. Keep tested images for rollback: rebuilding identical source
later can pick up a newer base image.

## Prepare Ubuntu

Install Docker Engine using the [official Ubuntu APT instructions](https://docs.docker.com/engine/install/ubuntu/).
Use Engine 28+ and Compose 2.30+ (raw env-file support). Use `sudo docker` rather
than adding accounts to the root-equivalent Docker group.

```bash
sudo docker version
sudo docker compose version
sudo systemctl enable --now docker
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
sudo install -d -o root -g root -m 755 /opt/certiblank
sudo install -d -o root -g root -m 700 /etc/certiblank
```

If the earlier `certiblank.service` was installed, stop/disable that app service
before starting the container so they do not compete for port 3000. Leave Docker
and Nginx's own system services enabled.

Upload the unzipped artifact using `scp` from your PC, keeping its file hierarchy.
Never copy the SSH private key to the server.

## Load and configure

From the uploaded release directory on EC2:

```bash
sha256sum -c certiblank-image.tar.gz.sha256
sudo docker load --input certiblank-image.tar.gz
sudo install -m 644 deploy/ec2/compose.yaml /opt/certiblank/compose.yaml
sudo install -m 644 release.env /opt/certiblank/release.env
```

Stop if the checksum fails. Docker accepts the compressed image archive.

**First deployment only:** install the runtime template. Do not overwrite the real
environment file on subsequent deployments.

```bash
sudo install -o root -g root -m 600 deploy/ec2/app.env.example /etc/certiblank/app.env
sudo nano /etc/certiblank/app.env
```

Replace placeholders with the real Supabase application URL, existing production
auth secret, and canonical HTTPS origin. Compose reads this file in **raw format**:
use `NAME=value` without wrapping quotes. Dollar signs are preserved literally.
URL-encode database password characters as required by PostgreSQL connection URLs.
Do not blindly copy a quoted dotenv file into this raw-format file.

Google is optional; register `https://YOUR_DOMAIN/api/auth/callback/google` if used.
The container does not need migration credentials (`DIRECT_URL`) at runtime.
Docker administrators can read container environment values: do not share
`docker inspect` or expanded `docker compose config` output. Validate with
`config --quiet`.

## Start the application

```bash
cd /opt/certiblank
sudo docker compose --env-file release.env config --quiet
sudo docker compose --env-file release.env up -d --wait --wait-timeout 120
sudo docker compose --env-file release.env ps
curl --fail http://127.0.0.1:3000/ -o /dev/null
```

Compose publishes **only 127.0.0.1:3000 on the host**. Next.js listens on 0.0.0.0
inside the container, which is necessary for Docker forwarding. Never change the
host mapping to 0.0.0.0 or open 3000 in EC2. Docker-published ports can bypass UFW:
do not rely on UFW to repair a bad port mapping.

The app runs as UID 1000, with no Linux capabilities, a read-only root filesystem,
a named writable Next.js cache volume, and bounded temporary storage. Initial
limits are 1 GiB memory, 256 PIDs, and 3 rotating 10 MiB log files. Monitor these;
they are low-traffic starting settings, not a capacity guarantee.

The health check exercises a DB-independent API validation path. It proves the
app responds, not that Supabase works. The restart policy recovers exited processes
and starts containers after reboot; an **unhealthy but still running** container
is not automatically restarted. Alert on health failures and test DB connectivity
before cutover.

## Nginx and HTTPS

Replace `certiblank.example.com` in the Nginx template with your domain. Install it
as `/etc/nginx/sites-available/certiblank`, enable it with a symlink in
`/etc/nginx/sites-enabled/`, and disable the packaged default site if enabled.

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d YOUR_DOMAIN --redirect
sudo certbot renew --dry-run
```

The HTTP template is only for certificate bootstrapping. Do not open login/exam use
to visitors until HTTPS works: production cookies require HTTPS. Then add
`add_header Strict-Transport-Security "max-age=31536000" always;` in the TLS server
block and validate/reload. Do not preload or include unrelated subdomains.

Nginx overwrites X-Certiblank-Client-IP with the remote socket address. Both auth and
exam rate limiting trust only that header in EC2 mode. Do not expose the app port
directly or enable a CDN proxy without configuring a restricted, verified upstream
IP policy. Otherwise users can share rate limits or bypass the intended ingress.

Response buffering and proxy caching are off to preserve streaming and private
account/exam responses. Access logging is disabled to avoid recording OAuth query
strings; add redacted/path-only logs if needed.

## Verification, updates, and rollback

Before moving users, test HTTPS/static assets and `/api/platforms` database access,
signup/login/logout, Google if enabled, account history, anonymous resume,
claim-on-login, domain feedback, and mock submission. Test rate limits with forged
forwarding headers through Nginx. From another computer verify that port 3000
is unreachable. Inspect container errors locally before sharing redacted logs.

For an update, verify/load the new artifact first. Preserve the previous image tag:

```bash
cd /opt/certiblank
sudo cp release.env release.previous.env
# Replace this path with the actual new uploaded release directory.
sudo install -m 644 /path/to/upload/release.env release.env
sudo docker compose --env-file release.env up -d --wait --wait-timeout 120
```

Repeat smoke tests. To roll back (keep the previous image loaded):

```bash
sudo cp /opt/certiblank/release.previous.env /opt/certiblank/release.env
cd /opt/certiblank
sudo docker compose --env-file release.env up -d --wait --wait-timeout 120
```

Version Compose/Nginx configuration alongside the release if changing them.
Image rollback does not reverse database migrations (none are needed here).
Single-container replacement has brief downtime. Stale open tabs may need a reload.

Diagnostics:

```bash
cd /opt/certiblank
sudo docker compose --env-file release.env logs --tail 80 app
sudo docker compose --env-file release.env ps
sudo docker stats --no-stream
```

Monitor cache/image disk use, memory, CPU credits, uptime, renewal, and AWS spend.
Retain current and previous images; do not blindly prune rollback images/volumes.
Enable security updates and bounded-retention EBS snapshots. EC2 snapshots do not
back up Supabase. Back up server configuration/secrets separately and privately.

Cookies do not transfer between hostnames: users must sign in again. Anonymous
progress tied to Netlify should be completed/claimed before cutover. Retire Netlify
only after verification and deciding how to handle existing users.
