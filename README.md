# Clockwork — ASP.NET Core Backend

## Project structure

```
ClockworkApi/
  Controllers/
    AuthController.cs          — POST /api/auth/signup, /api/auth/signin
    ClientsController.cs       — GET/POST/PUT/DELETE /api/clients
    ConsultationsController.cs — GET/POST/PUT/DELETE /api/consultations
  Data/
    AppDbContext.cs             — Entity Framework database context
  DTOs/
    DTOs.cs                    — Request and response shapes
  Models/
    Models.cs                  — User, Client, Consultation entities
  Services/
    TokenService.cs            — JWT generation
  Program.cs                   — App startup, middleware, CORS, auth
  appsettings.json             — Connection string and JWT config
  ClockworkApi.csproj          — NuGet packages

AppContext.tsx                 — Drop this into your Expo app to replace the
                                 AsyncStorage version and call the real API
```

---

## Setup instructions

### 1. Install prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8)
- [MySQL](https://dev.mysql.com/downloads/mysql/) or [MySQL via XAMPP](https://www.apachefriends.org/)

### 2. Create the MySQL database

Open MySQL and run:
```sql
CREATE DATABASE clockwork_db;
```

### 3. Configure appsettings.json

Open `appsettings.json` and update two things:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=clockwork_db;User=root;Password=YOUR_MYSQL_PASSWORD;"
  },
  "Jwt": {
    "Key": "REPLACE_WITH_A_LONG_RANDOM_SECRET_KEY_AT_LEAST_32_CHARS"
  }
}
```

For the JWT key, just use any long random string — for example:
`xK9#mP2$qL7@nR4&wT6!vY1^uJ8*oH3`

### 4. Install packages and create the database tables

Run these commands from inside the `ClockworkApi` folder:

```bash
dotnet restore
dotnet tool install --global dotnet-ef
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### 5. Run the backend

```bash
dotnet run
```

The API will start at `http://localhost:5000`.

---

## Connecting your Expo app

### Step 1 — Find your PC's local IP address

In PowerShell run:
```powershell
ipconfig
```
Look for the `IPv4 Address` under your Wi-Fi adapter. It will look like `192.168.1.42`.

### Step 2 — Update AppContext.tsx

Replace `AppContext.tsx` in your Expo project with the one provided in this folder.
Then update the `API_URL` at the top of the file:

```typescript
const API_URL = 'http://192.168.1.42:5000'; // ← your PC's IP
```

Your phone and PC must be on the same Wi-Fi network.

### Step 3 — Restart Expo

```bash
npx expo start --clear
```

---

## API endpoints

### Auth
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | `{ email, password, defaultRate }` | Create account |
| POST | `/api/auth/signin` | `{ email, password }` | Sign in, returns JWT |

All other endpoints require the JWT in the `Authorization: Bearer <token>` header.

### Clients
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/clients` | Get all clients for current user |
| GET | `/api/clients/{id}` | Get one client |
| POST | `/api/clients` | Create a client |
| PUT | `/api/clients/{id}` | Update a client |
| DELETE | `/api/clients/{id}` | Delete a client |

### Consultations
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/consultations` | Get all consultations (supports `?clientId=1&date=2025-04`) |
| GET | `/api/consultations/{id}` | Get one consultation |
| POST | `/api/consultations` | Save a consultation |
| PUT | `/api/consultations/{id}` | Edit charge or notes |
| DELETE | `/api/consultations/{id}` | Delete a consultation |
