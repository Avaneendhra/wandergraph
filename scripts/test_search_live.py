import httpx
import sys
sys.stdout.reconfigure(encoding='utf-8')

for query in ['popular places', 'cafes in Jubilee Hills', 'historical monuments']:
    r = httpx.post('http://localhost:5173/api/search', json={'city': 'hyderabad', 'query': query, 'limit': 6}, timeout=25.0)
    data = r.json()
    print(f"=== SEARCH: '{query}' (Status: {r.status_code}, Found: {data.get('total_found')}) ===")
    for res in data.get('results', [])[:4]:
        p = res.get('place') or {}
        ph = p.get('photos', [{}])[0] if p.get('photos') else {}
        print('  *', p.get('name'), '| ID:', p.get('id'), '| Rating:', p.get('rating'))
        print('    Photo:', ph.get('proxy_url', '')[:70])
        print('    Attr :', ph.get('attributions', [{}])[0].get('display_name', ''))
