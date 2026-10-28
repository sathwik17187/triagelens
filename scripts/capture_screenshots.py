import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

DOCS_DIR = Path(__file__).resolve().parent.parent / "docs" / "screenshots"

async def capture_screenshots():
    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        print("1. Capturing Landing Page...")
        await page.goto("http://127.0.0.1:5173", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=str(DOCS_DIR / "01_landing.png"), full_page=True)

        print("2. Capturing Console View...")
        await page.click("text=Console")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=str(DOCS_DIR / "02_console.png"), full_page=True)

        print("3. Injecting cartFailure Fault & Analyzing...")
        # Inject cartFailure
        inject_btn = page.locator("button:has-text('INJECT')").first
        if await inject_btn.count() > 0:
            await inject_btn.click()
            await page.wait_for_timeout(2000)

        # Trigger AI Analysis
        triage_btn = page.locator("button:has-text('Run AI Incident Triage')")
        if await triage_btn.count() > 0:
            await triage_btn.click()
            print("   Waiting for triage analysis pipeline...")
            await page.wait_for_selector("text=AI ROOT CAUSE DIAGNOSIS", timeout=60000)
            await page.wait_for_timeout(2000)

        print("4. Capturing Incident Detail View...")
        await page.screenshot(path=str(DOCS_DIR / "03_incident_detail.png"), full_page=True)

        print("5. Capturing Case Library View...")
        await page.click("text=Case Library")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=str(DOCS_DIR / "04_case_library.png"), full_page=True)

        print("6. Capturing Mobile Responsive (375px)...")
        mobile_context = await browser.new_context(viewport={"width": 375, "height": 812})
        mobile_page = await mobile_context.new_page()
        await mobile_page.goto("http://127.0.0.1:5173", wait_until="networkidle")
        await mobile_page.wait_for_timeout(1500)
        await mobile_page.screenshot(path=str(DOCS_DIR / "05_mobile_responsive.png"), full_page=True)

        await browser.close()

        print(f"\nAll screenshots successfully saved to: {DOCS_DIR.resolve()}")
        if console_errors:
            print(f"Warning: {len(console_errors)} console errors caught: {console_errors[:3]}")
        else:
            print("Zero console errors detected. Clean execution!")

if __name__ == "__main__":
    asyncio.run(capture_screenshots())

