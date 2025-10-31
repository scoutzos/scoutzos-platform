# ScoutzOS

ScoutzOS is an AI‑driven platform for property management and investor operations.  This monorepo contains a FastAPI backend, modular domain models, and placeholder scaffolding for a Next.js frontend.  The code is generated automatically by the AI Builder orchestrator and is intended as a starting point for further development.

## Project Structure

```
scoutzos/
├── apps/
│   ├── api/                 # FastAPI backend
│   │   ├── requirements.txt # Python dependencies
│   │   └── src/
│   │       └── scoutzos/
│   │           ├── __init__.py
│   │           ├── config.py
│   │           ├── db.py
│   │           ├── main.py
│   │           ├── models/
│   │           ├── schemas/
│   │           └── routers/
│   └── web/                 # Placeholder for Next.js frontend
│       └── README.md
├── docs/                    # Phase documentation and guides
│   └── phases.md
└── tests/                   # Backend API tests
    └── test_endpoints.py
```

Refer to `docs/phases.md` for descriptions of each phase.  The backend is ready to run with SQLite by default; set the `DATABASE_URL` environment variable to connect to PostgreSQL or another database.