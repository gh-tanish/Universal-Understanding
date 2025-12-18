Universal Understanding (v4)

This folder is a local repository skeleton for `universal-understanding-v4`.

Contents:
- `copy_and_init.ps1`: PowerShell script to copy the workspace `Website/` into this folder and create an initial git commit.
- `.gitignore`: basic ignores for site files and backups.
- `GIT_PUSH_COMMANDS.txt`: exact commands to create the remote repository and push from your machine.

How to use:
1. Open PowerShell in this folder.
2. Run `./copy_and_init.ps1` to copy `..\Website` files and create an initial commit.
3. Follow the commands in `GIT_PUSH_COMMANDS.txt` to create the remote repo and push.

Notes:
- I won't push to GitHub without a token; run the push commands locally so your credentials remain private.
- After pushing, enable Pages from `main` → `/` in the repository Settings, or run `gh` CLI commands.
