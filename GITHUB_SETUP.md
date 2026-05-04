# How to push Clockwork to GitHub

## Step 1 — Run the cleanup script first

In PowerShell, from your project root:

```powershell
.\cleanup.ps1
```

This removes the empty conflicting files that show up as warnings.

## Step 2 — Copy the new files into your project

Copy these files from this delivery into your project:

```
README.md              → project root
.gitignore             → project root  (replace the existing one)
ClockworkApi.Tests/    → place alongside your ClockworkApi/ folder
```

## Step 3 — Create a GitHub repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **+** button → **New repository**
3. Name it `clockwork-tracking-for-lawyers`
4. Set it to **Public** (so employers can see it)
5. Do NOT tick "Add a README" — you already have one
6. Click **Create repository**

## Step 4 — Push your code

Run these commands from your project root in PowerShell:

```powershell
# If you don't have git set up yet
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Initialise and push
git init
git add .
git commit -m "Initial commit: full-stack consultation tracker"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/clockwork-tracking-for-lawyers.git
git push -u origin main
```

## Step 5 — Add screenshots (makes a huge difference)

1. Take screenshots of your app running on your phone
2. Create a `screenshots/` folder in your project
3. Add the images and uncomment the screenshot section in `README.md`
4. Then:

```powershell
git add .
git commit -m "Add app screenshots to README"
git push
```

## Ideal screenshots to take

- Login screen
- Home/dashboard screen (with some data showing)
- Timer screen while running
- Consultation summary before saving
- History screen with a few records
- Client detail screen

## Step 6 — Recommended commit structure going forward

If you want a clean commit history that tells a story, reset and re-commit in stages:

```powershell
# Warning: this rewrites history. Only do this before sharing the link.
git reset --soft $(git rev-list --max-parents=0 HEAD)
git add .
git commit -m "feat: project setup — Expo Router + ASP.NET Core scaffold"

# Then add staged commits for each feature
git add app/(auth)/ context/
git commit -m "feat: user authentication with JWT and BCrypt"

git add app/(tabs)/clients.tsx app/client/
git commit -m "feat: client management with hourly rate support"

git add app/(tabs)/timer.tsx
git commit -m "feat: consultation timer with pause/resume and charge calculation"

git add app/(tabs)/history.tsx app/consultation/
git commit -m "feat: consultation history with client and date filtering"

git add ClockworkApi/
git commit -m "feat: ASP.NET Core REST API with MySQL and EF Core"

git add ClockworkApi.Tests/
git commit -m "test: billing calculation and data ownership unit tests"

git push --force
```
