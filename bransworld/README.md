Brans´World - Dark Fashion Store
================================

Stack
-----
- Frontend: EJS + Bootstrap 5 (dark theme) + custom CSS
- Backend: Node.js (Express, sessions, SQLite)
- Microservice: Python (FastAPI) for recommendations

Getting started
---------------
1) Node server
```
cd server
npm install
npm run dev
```
Server runs on `http://localhost:3000`.

2) Python service
```
cd ../python_service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py
```
Service runs on `http://127.0.0.1:8000`.

Admin access
------------
- Default admin user: `admin`
- Password: `admin123`

Environment variables
---------------------
- `PORT` (default 3000)
- `SESSION_SECRET` (change in production)
- `RECO_SERVICE_URL` (default `http://127.0.0.1:8000`)

Scripts
-------
- `npm run dev`: Starts Express with Nodemon
- `npm start`: Starts Express

Project structure
-----------------
```
bransworld/
  server/
    src/
      routes/ (web, api, admin)
      views/ (EJS pages)
      public/ (css, js)
      db.js
      server.js
    package.json
  python_service/
    app.py
    requirements.txt
```

