## Helper Commands

### Git

**Pull latest code from `dev` branch:**

```bash
git pull origin dev
```

**Fetch latest changes from remote and prune deleted branches:**

```bash
git fetch --prune
```

**Reset to the `dev` branch:**

```bash
git reset --hard origin/dev
```

### Utilities

**Generate a new 32-character base64 string for encryption key (PowerShell):**

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

```bash
head -c 24 /dev/urandom | base64
```
