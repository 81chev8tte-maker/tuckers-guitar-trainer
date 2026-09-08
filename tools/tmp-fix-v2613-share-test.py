from pathlib import Path

path = Path('browser-tests/app-smoke.spec.js')
text = path.read_text()

old = """  await page.getByRole('button',{name:'Send Report to Parent'}).click();\n  const sharedData=await page.evaluate(()=>window.__sharedData);"""
new = """  await page.getByRole('button',{name:'Send Report to Parent'}).click();\n  await expect.poll(()=>page.evaluate(()=>Boolean(window.__sharedData))).toBe(true);\n  const sharedData=await page.evaluate(()=>window.__sharedData);"""
if text.count(old) != 1:
    raise SystemExit(f'expected one preferred-share assertion anchor, found {text.count(old)}')
text = text.replace(old, new, 1)

old = """  await page.getByRole('button',{name:'Send Report to Parent'}).click();\n  const textFallback=await page.evaluate(()=>window.__sharedData);"""
new = """  await page.getByRole('button',{name:'Send Report to Parent'}).click();\n  await expect.poll(()=>page.evaluate(()=>Boolean(window.__sharedData))).toBe(true);\n  const textFallback=await page.evaluate(()=>window.__sharedData);"""
if text.count(old) != 1:
    raise SystemExit(f'expected one text-fallback assertion anchor, found {text.count(old)}')
text = text.replace(old, new, 1)

path.write_text(text)
