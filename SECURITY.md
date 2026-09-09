# Security policy

## Reporting a vulnerability privately

Please do not put vulnerability details, proof-of-concept exploits, database URLs,
or credentials in public issues, discussions, or pull requests.

On the upstream GitHub repository, open **Security** (or **Security and quality**)
> **Advisories** > **Report a vulnerability** to submit a private report.
This requires the maintainer to enable GitHub private vulnerability reporting;
adding this file alone does not enable it.

If the button is unavailable, open an issue containing only a request to enable
private reporting. Do not include the affected endpoint, exploit, or other
sensitive details. Wait for the private channel before sharing the report.

Include the affected commit/version, reproduction steps using a local test
environment, expected and actual behavior, impact, and any suggested fix.
Redact secrets and personal information from all attachments.

## Scope and handling

Reports should target the latest code on `main`. Older versions do not have a
separate security maintenance policy. There is no guaranteed response time or
paid bug bounty. Please coordinate disclosure through the private report while
the maintainer investigates and prepares a fix.

Use your own local instance and test data for reproduction. Do not access other
users' attempts or run disruptive tests against the hosted service.

## Maintainer setup

Before public release, enable **Private vulnerability reporting** in repository
**Settings > Advanced Security**, then verify the reporting button appears under
Security > Advisories. Review reports there and keep sensitive discussion private.

See [GitHub's private reporting instructions](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/report-privately).
