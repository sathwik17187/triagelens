#!/usr/bin/env python3
import os
import shutil
import subprocess
import sys
import time

def check_docker():
    return shutil.which("docker") is not None

def run_up():
    print("=" * 60)
    print("           STARTING TRIAGELENS STACK")
    print("=" * 60)

    if check_docker():
        print("[+] Docker detected. Launching via Docker Compose...")
        compose_cmd = [
            "docker", "compose",
            "-f", "otel-demo/compose.yaml",
            "-f", "otel-demo/compose.observability.yaml",
            "-f", "docker-compose.yml",
            "-f", "docker-compose.override.yml",
            "up", "-d"
        ]
        res = subprocess.run(compose_cmd)
        if res.returncode == 0:
            print("[+] Docker Compose stack is up!")
            print("    Backend  : http://localhost:8000")
            print("    Frontend : http://localhost:5173")
            return
        print("[-] Docker Compose reported an error. Falling back to local mode...")

    print("[*] Running in Native Local Mode:")
    print("    Starting Uvicorn backend on http://127.0.0.1:8001...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "8001"]
    )

    print("    Starting Vite frontend on http://127.0.0.1:5173...")
    frontend_proc = subprocess.Popen(
        ["npx", "vite", "--host", "127.0.0.1", "--port", "5173"],
        cwd=os.path.join(os.path.dirname(__file__), "frontend"),
        shell=True
    )

    print("\n" + "=" * 60)
    print("  TriageLens is running!")
    print("  -> UI Console : http://127.0.0.1:5173")
    print("  -> Backend API: http://127.0.0.1:8001")
    print("  Press Ctrl+C to terminate both servers.")
    print("=" * 60 + "\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping services...")
        backend_proc.terminate()
        frontend_proc.terminate()

def run_down():
    if check_docker():
        subprocess.run(["docker", "compose", "-f", "docker-compose.yml", "down"])
    print("[+] Stopped TriageLens.")

def main():
    if len(sys.argv) < 2:
        print("Usage: python run.py [up|down|eval|test|screenshots]")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    if cmd == "up":
        run_up()
    elif cmd == "down":
        run_down()
    elif cmd == "eval":
        subprocess.run([sys.executable, "scripts/eval.py"])
    elif cmd == "test":
        subprocess.run([sys.executable, "-m", "pytest", "backend/tests"])
    elif cmd == "screenshots":
        subprocess.run([sys.executable, "scripts/capture_screenshots.py"])
    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)

if __name__ == "__main__":
    main()

