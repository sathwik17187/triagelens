import json
from datetime import datetime, timezone
from typing import List, Optional
import aiosqlite
from .config import settings
from .models import AnalysisOutput, EvidenceItem, Incident, SuspectScore

DB_PATH = settings.database_url.replace("sqlite+aiosqlite:///", "")

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS incidents (
                id TEXT PRIMARY KEY,
                fault_name TEXT NOT NULL,
                ground_truth_service TEXT NOT NULL,
                status TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT,
                evidence TEXT,
                ranked_suspects TEXT,
                analysis TEXT,
                created_at TEXT NOT NULL
            )
        """)
        await db.commit()

async def save_incident(incident: Incident):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT OR REPLACE INTO incidents (
                id, fault_name, ground_truth_service, status,
                start_time, end_time, evidence, ranked_suspects, analysis, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            incident.id,
            incident.fault_name,
            incident.ground_truth_service,
            incident.status,
            incident.start_time,
            incident.end_time,
            json.dumps([e.model_dump() for e in incident.evidence]),
            json.dumps([s.model_dump() for s in incident.ranked_suspects]),
            json.dumps(incident.analysis.model_dump()) if incident.analysis else None,
            incident.created_at,
        ))
        await db.commit()

async def get_incident(incident_id: str) -> Optional[Incident]:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            return _row_to_incident(row)

async def list_incidents() -> List[Incident]:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT * FROM incidents ORDER BY created_at DESC") as cursor:
            rows = await cursor.fetchall()
            return [_row_to_incident(r) for r in rows]

def _row_to_incident(row) -> Incident:
    evidence_data = json.loads(row[6]) if row[6] else []
    suspects_data = json.loads(row[7]) if row[7] else []
    analysis_data = json.loads(row[8]) if row[8] else None

    return Incident(
        id=row[0],
        fault_name=row[1],
        ground_truth_service=row[2],
        status=row[3],
        start_time=row[4],
        end_time=row[5],
        evidence=[EvidenceItem(**e) for e in evidence_data],
        ranked_suspects=[SuspectScore(**s) for s in suspects_data],
        analysis=AnalysisOutput(**analysis_data) if analysis_data else None,
        created_at=row[9],
    )

