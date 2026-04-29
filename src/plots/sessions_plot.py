import json, io, base64
from collections import Counter
import matplotlib
matplotlib.use('agg')
import matplotlib.pyplot as plt
from js import document, window

data = json.loads(window.__pyodideData)

day_counts = Counter(d['day'] for d in data)
sorted_days = sorted(day_counts.keys())
counts = [day_counts[d] for d in sorted_days]

fig, ax = plt.subplots(figsize=(6, 4))
ax.plot(sorted_days, counts, marker='o', color='steelblue', linewidth=2)
ax.fill_between(sorted_days, counts, alpha=0.1, color='steelblue')
ax.set_title('Games Played Over Time')
ax.set_ylabel('Games Played')
ax.set_xlabel('Date')
plt.xticks(rotation=30, ha='right')
plt.tight_layout()

buf = io.BytesIO()
fig.savefig(buf, format='png')
buf.seek(0)
img_b64 = base64.b64encode(buf.read()).decode('utf-8')
plt.close(fig)

target = document.getElementById('sessions-chart')
target.innerHTML = f'<img src="data:image/png;base64,{img_b64}" alt="Sessions Chart" style="width:100%" />'