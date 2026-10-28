.PHONY: up down eval test screenshots clean help

PYTHON ?= python

help:
	@echo "TriageLens Commands:"
	@echo "  make up          - Start TriageLens full stack (backend, frontend, Ollama)"
	@echo "  make down        - Stop running services"
	@echo "  make eval        - Execute benchmark evaluation across all 19 fault flags"
	@echo "  make test        - Run backend test suite (deterministic scorer & JSON validation)"
	@echo "  make screenshots - Run Playwright automated screenshot suite"

up:
	@$(PYTHON) run.py up

down:
	@$(PYTHON) run.py down

eval:
	@$(PYTHON) scripts/eval.py

test:
	@$(PYTHON) -m pytest backend/tests

screenshots:
	@$(PYTHON) scripts/capture_screenshots.py

clean:
	@rm -rf backend/__pycache__ frontend/dist docs/screenshots/*.tmp

