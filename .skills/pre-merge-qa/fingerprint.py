# Prints three fingerprints of a routes.py read from stdin, to compare the base branch with HEAD:
#   openapi  -> public API: endpoints, parameters and response fields (BE-02)
#   contract -> FinancialMovement schema; if it changes, BE-03 applies
#   mock     -> mock data sequence for seed=42, without the year (BE-05)
# Usage: git show origin/main:backend/app/routes.py | docker compose exec -T backend python -c "$(cat .skills/pre-merge-qa/fingerprint.py)"
import hashlib
import json
import sys
import types

from fastapi import FastAPI

module = types.ModuleType("routes_under_test")
sys.modules[module.__name__] = module
exec(sys.stdin.read(), module.__dict__)

app = FastAPI()
app.include_router(module.router)


def short_hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:12]


mock = [
    (m.amount, m.create_date.month, m.create_date.day, m.operation_type, m.category, m.business_type)
    for m in module.generate_mock_movements(seed=42)
]
print("openapi ", short_hash(json.dumps(app.openapi(), sort_keys=True)))
print("contract", short_hash(json.dumps(module.FinancialMovement.model_json_schema(), sort_keys=True)))
print("mock    ", short_hash(repr(mock)))
